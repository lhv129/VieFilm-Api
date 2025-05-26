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

const getAll = async () => {
  try {
    const tickets = await GET_DB().collection(TICKET_COLLECTION_NAME)
      .find({ _deletedAt: false })
      .sort({ createdAt: -1 })
      .toArray();
    return tickets;
  } catch (error) {
    throw new Error(error);
  }
}

const getAllByUser = async (userId) => {
  try {
    const tickets = await GET_DB()
      .collection(TICKET_COLLECTION_NAME)
      .find({ userId: userId, _deletedAt: false })
      .sort({ createdAt: -1 })
      .project({
        paymentMethodId: 0,
        updatedAt: 0,
        _deletedAt: 0,
        baseAmount: 0,
        expireAt: 0
      })
      .toArray();
    return tickets;
  } catch (error) {
    throw new Error(error);
  }
}

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
        ticket_details: ticketDetailsWithSeatCode,
        product_details: ticketProductsWithName,
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