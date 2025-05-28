import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";
import { ticketDetailModel } from "./ticketDetailModel";
import { ticketProductDetail } from "./ticketProductDetailModel";
import { showtimeModel } from "./showtimeModel";


const TICKET_COLLECTION_NAME = "tickets";
const TICKET_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .allow(null, '')
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  showtimeId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  promoCodeId: Joi.string()
    .allow(null, '')
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  paymentMethodId: Joi.string()
    .allow(null, '')
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  cinemaId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  code: Joi.string().required(),
  staff: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
  customer: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
  totalAmount: Joi.number().min(0).default(0),
  baseAmount: Joi.number().min(0).default(0),
  discountPrice: Joi.number().min(0).default(0),
  status: Joi.string().valid('pending', 'paid', 'used', 'cancelled', 'hold').default('pending'),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  expireAt: Joi.date().timestamp("javascript"),
  _deletedAt: Joi.boolean().default(false),
});

const getAll = async (reqBody) => {
  try {
    const { code, cinemaId, movieId, date, status } = reqBody;

    const pipeline = [];

    // Điều kiện lọc từ tickets
    const matchStage = {
      _deletedAt: false,
    };
    if (cinemaId) matchStage.cinemaId = new ObjectId(cinemaId);
    if (status) matchStage.status = Array.isArray(status) ? { $in: status } : status;
    if (code) matchStage.code = code;

    pipeline.push({ $match: matchStage });

    // Join showtimes
    pipeline.push({
      $lookup: {
        from: "showtimes",
        localField: "showtimeId",
        foreignField: "_id",
        as: "showtime"
      }
    });
    pipeline.push({ $unwind: "$showtime" });

    // Join payment_methods
    pipeline.push({
      $lookup: {
        from: "payment_methods",
        localField: "paymentMethodId",
        foreignField: "_id",
        as: "payment"
      }
    });
    pipeline.push({ $unwind: "$payment" });

    // Join movies
    pipeline.push({
      $lookup: {
        from: "movies",
        localField: "showtime.movieId",
        foreignField: "_id",
        as: "movie"
      }
    });
    pipeline.push({ $unwind: "$movie" });

    // Lọc theo movieId và date (định dạng dd/mm/yyyy)
    const showtimeMatch = {};
    if (movieId) showtimeMatch["showtime.movieId"] = new ObjectId(movieId);
    if (date) showtimeMatch["showtime.date"] = date;

    if (Object.keys(showtimeMatch).length > 0) {
      pipeline.push({ $match: showtimeMatch });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({
      $project: {
        // Các field bạn muốn giữ lại từ ticket
        _id: 1,
        code: 1,
        cinemaId: 1,
        showtimeId: 1,
        paymentMethodId: 1,
        totalAmount: 1,
        discountPrice: 1,
        customer: 1,
        createdAt: 1,
        status: 1,
        seats: 1,
        // Trường từ showtime
        showtime: {
          startTime: "$showtime.startTime",
          date: "$showtime.date"
        },
        // Chỉ lấy name từ payment
        payment: "$payment.name",
        movie: "$movie.title"
      }
    });


    const tickets = await GET_DB().collection(TICKET_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray();

    return tickets;
  } catch (error) {
    throw new Error(error);
  }
};



const getOneByUser = async (userId, ticketId) => {
  try {
    const tickets = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(ticketId),
            userId: userId,
            _deletedAt: false,
            status: { $in: ["paid", "used"] }
          }
        },
        {
          $lookup: {
            from: "payment_methods",
            localField: "paymentMethodId",
            foreignField: "_id",
            as: "payment"
          }
        },
        {
          $unwind: "$payment"
        },
        {
          $lookup: {
            from: "cinemas",
            localField: "cinemaId",
            foreignField: "_id",
            as: "cinema"
          }
        },
        {
          $unwind: "$cinema"
        },
        {
          $lookup: {
            from: "showtimes",
            localField: "showtimeId",
            foreignField: "_id",
            as: "showtime"
          }
        },
        {
          $unwind: "$showtime"
        },
        {
          $lookup: {
            from: "screens",
            localField: "showtime.screenId",
            foreignField: "_id",
            as: "screen"
          }
        },
        {
          $unwind: "$screen"
        },
        {
          $lookup: {
            from: "movies",
            localField: "showtime.movieId",
            foreignField: "_id",
            as: "movie"
          }
        },
        {
          $unwind: "$movie"
        },
        // Thêm lookup lấy ticket_details
        {
          $lookup: {
            from: "ticket_details",
            let: { ticketId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$ticketId", "$$ticketId"] } } },
              {
                // lookup thêm seats để lấy seatCode theo seatId
                $lookup: {
                  from: "seats",
                  localField: "seatId",
                  foreignField: "_id",
                  as: "seat"
                }
              },
              {
                // seat luôn là mảng, unwind để lấy 1 phần tử
                $unwind: {
                  path: "$seat",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                // Chọn trường cần thiết, thêm seatCode từ seat
                $project: {
                  price: 1,
                  seatCode: "$seat.seatCode"
                }
              }
            ],
            as: "seats"
          }
        },
        // Thêm lookup lấy ticket_product_details
        {
          $lookup: {
            from: "ticket_product_details",
            let: { ticketId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$ticketId", "$$ticketId"] } } },
              {
                // lookup thêm seats để lấy seatCode theo seatId
                $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  as: "product"
                }
              },
              {
                // seat luôn là mảng, unwind để lấy 1 phần tử
                $unwind: {
                  path: "$product",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                // Chọn trường cần thiết, thêm seatCode từ seat
                $project: {
                  quantity: 1,
                  price: 1,
                  name: "$product.name"
                }
              }
            ],
            as: "products"
          }
        },
        // Sắp xếp giảm dần theo ngày tạo
        {
          $sort: { createdAt: -1 }
        },
        {
          $addFields: {
            details: {
              seats: "$seats",
              products: "$products"
            }
          }
        },
        {
          $project: {
            _id: 1,
            customer: 1,
            code: 1,
            totalAmount: 1,
            discountPrice: 1,
            createdAt: 1,
            status: 1,
            "payment.name": 1,
            "cinema.name": 1,
            "cinema.address": 1,
            "showtime.startTime": 1,
            "showtime.date": 1,
            "screen.name": 1,
            "movie.title": 1,
            details: 1
          }
        }
      ])
      .toArray();

    return tickets;
  } catch (error) {
    throw new Error(error);
  }
};

const getAllByUser = async (userId, page, limit, dateFilter) => {
  try {
    const skip = (page - 1) * limit;

    const matchStage = {
      userId: userId,
      _deletedAt: false,
      status: { $in: ["paid", "used"] },
      ...dateFilter
    };

    const totalCount = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .countDocuments(matchStage);

    const tickets = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "cinemas",
            localField: "cinemaId",
            foreignField: "_id",
            as: "cinema"
          }
        },
        {
          $unwind: {
            path: "$cinema",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "showtimes",
            localField: "showtimeId",
            foreignField: "_id",
            as: "showtime"
          }
        },
        {
          $unwind: {
            path: "$showtime",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "screens",
            localField: "showtime.screenId",
            foreignField: "_id",
            as: "screen"
          }
        },
        {
          $unwind: {
            path: "$screen",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "movies",
            localField: "showtime.movieId",
            foreignField: "_id",
            as: "movie"
          }
        },
        {
          $unwind: {
            path: "$movie",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "ticket_details",
            let: { ticketId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$ticketId", "$$ticketId"] } } },
              {
                $lookup: {
                  from: "seats",
                  localField: "seatId",
                  foreignField: "_id",
                  as: "seat"
                }
              },
              {
                $unwind: {
                  path: "$seat",
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  _id: 1,
                  seatId: 1,
                  price: 1,
                  seatCode: "$seat.seatCode"
                }
              }
            ],
            as: "seats"
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            code: 1,
            totalAmount: 1,
            discountPrice: 1,
            createdAt: 1,
            status: 1,
            "cinema.name": 1,
            "showtime.startTime": 1,
            "showtime.date": 1,
            "screen.name": 1,
            "movie.title": 1,
            "seats.seatCode": 1,
          }
        }
      ])
      .toArray();

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: tickets,
      pagination: {
        page,
        totalPages
      }
    };
  } catch (error) {
    throw error;
  }
};


const validateBeforeStaffCreate = async (data) => {
  const validatedData = await TICKET_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
  return {
    ...validatedData,
    showtimeId: new ObjectId(validatedData.showtimeId),
    cinemaId: new ObjectId(validatedData.cinemaId),
  }
};

const staffCreate = async (data) => {
  try {
    const validData = await validateBeforeStaffCreate(data);
    const ticket = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .insertOne(validData);
    return ticket;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreate = async (data) => {
  const validatedData = await TICKET_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
  return {
    ...validatedData,
    userId: new ObjectId(validatedData.userId),
    showtimeId: new ObjectId(validatedData.showtimeId),
    cinemaId: new ObjectId(validatedData.cinemaId),
  }
};

const create = async (data) => {
  try {
    const validData = await validateBeforeCreate(data);
    const ticket = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .insertOne(validData);
    return ticket;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id),
      });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const findOne = async (filter) => {
  try {
    const result = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .findOne(filter);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};


const getDelete = async (id) => {
  try {
    await ticketDetailModel.deleteMany({ ticketId: new ObjectId(id) });
    await ticketProductDetail.deleteMany({ ticketId: new ObjectId(id) });

    await GET_DB().collection(TICKET_COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    return [];
  } catch (error) {
    throw new Error(error);
  }
}

const updateTotalAmount = async (id, totalAmount) => {
  try {
    const ticket = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: { totalAmount: totalAmount, baseAmount: totalAmount } });
    return ticket;
  } catch (error) {
    throw error;
  }
};

const updateTotalAmountAfterProduct = async (id, totalAmount) => {
  try {
    const ticket = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: { totalAmount: totalAmount } });
    return ticket;
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (id, status) => {
  try {
    const ticket = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: status, updatedAt: Date.now() } });
    return ticket;
  } catch (error) {
    throw error;
  }
};

const getDetailAfterPayment = async (ticketId) => {
  try {
    const ticket = await findOneById(ticketId);
    if (!ticket) {
      return null;
    }

    // Lấy chi tiết vé và sản phẩm
    const ticketDetails = await ticketDetailModel.find({ ticketId: new ObjectId(ticketId) });
    const ticketProducts = await ticketProductDetail.find({ ticketId: new ObjectId(ticketId) });

    // Map seatId -> seatCode
    const seatIds = ticketDetails.map(detail => new ObjectId(detail.seatId));
    const seats = await GET_DB().collection('seats')
      .find({ _id: { $in: seatIds } })
      .toArray();

    const seatMap = seats.reduce((acc, seat) => {
      acc[seat._id.toString()] = seat.seatCode;
      return acc;
    }, {});

    const ticketDetailsWithSeatCode = ticketDetails.map(detail => ({
      ...detail,
      seatCode: seatMap[detail.seatId.toString()] || null,
    }));

    // Map productId -> name
    const productIds = ticketProducts.map(tp => new ObjectId(tp.productId));
    const products = await GET_DB().collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    const productMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product.name;
      return acc;
    }, {});

    const ticketProductsWithName = ticketProducts.map(tp => ({
      ...tp,
      name: productMap[tp.productId.toString()] || null,
    }));

    // Lấy showtime, screen, cinema, movie
    let showtimeInfo = null;
    let screenInfo = null;
    let cinemaInfo = null;
    let movieInfo = null;

    if (ticket.showtimeId) {
      showtimeInfo = await GET_DB().collection('showtimes')
        .findOne({ _id: new ObjectId(ticket.showtimeId) });

      if (showtimeInfo) {
        if (showtimeInfo.screenId) {
          screenInfo = await GET_DB().collection('screens')
            .findOne({ _id: new ObjectId(showtimeInfo.screenId) });

          if (screenInfo?.cinemaId) {
            cinemaInfo = await GET_DB().collection('cinemas')
              .findOne({ _id: new ObjectId(screenInfo.cinemaId) });
          }
        }

        if (showtimeInfo.movieId) {
          movieInfo = await GET_DB().collection('movies')
            .findOne({ _id: new ObjectId(showtimeInfo.movieId) });
        }
      }
    }

    return {
      _id: ticket._id,
      customer: ticket.customer,
      code: ticket.code,
      totalAmount: ticket.totalAmount,
      details: {
        seats: ticketDetailsWithSeatCode,
        products: ticketProductsWithName,
      },
      showtime: showtimeInfo,
      screen: screenInfo,
      cinema: cinemaInfo,
      movie: movieInfo,
    };
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết vé:", error);
    throw error;
  }
};

const getDetails = async (ticketId) => {
  try {
    const ticket = await findOneById(ticketId);
    if (!ticket) {
      return null;
    }
    const ticketDetails = await ticketDetailModel.find({ ticketId: new ObjectId(ticketId) });

    const ticketProducts = await ticketProductDetail.find({ ticketId: new ObjectId(ticketId) });

    const showtime = await showtimeModel.find({ _id: ticket.showtimeId });

    return {
      _id: ticket._id,
      customer: ticket.customer,
      code: ticket.code,
      totalAmount: ticket.totalAmount,
      status: ticket.status,
      details: {
        ticket_details: ticketDetails,
        product_details: ticketProducts,
      },
      showtime: showtime,
    };
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết vé:", error);
    throw error;
  }
};

const updateOne = async (ticketId, dataToUpdate) => {
  try {
    const result = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(ticketId) },
        { $set: dataToUpdate }
      );
    return result;
  } catch (error) {
    throw new Error("Không thể cập nhật ticket: " + error.message);
  }
};


export const ticketModel = {
  TICKET_COLLECTION_NAME,
  TICKET_COLLECTION_SCHEMA,
  getAll,
  getOneByUser,
  getAllByUser,
  create,
  staffCreate,
  findOne,
  findOneById,
  getDelete,
  updateTotalAmount,
  updateTotalAmountAfterProduct,
  updateStatus,
  getDetailAfterPayment,
  getDetails,
  updateOne
}