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
  code: Joi.string().required(),
  staff: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
  customer: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
  totalAmount: Joi.number().min(0).default(0),
  discountPrice: Joi.number().min(0).default(0),
  status: Joi.string().valid('pending', 'paid', 'used', 'cancelled','hold').default('pending'),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
  try {
    const tickets = await GET_DB().collection(TICKET_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
    return tickets;
  } catch (error) {
    throw new Error(error);
  }
}

const validateBeforeCreate = async (data) => {
  const validatedData = await TICKET_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
  return {
    ...validatedData,
    userId: new ObjectId(validatedData.userId),
    showtimeId: new ObjectId(validatedData.showtimeId),
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
      .updateOne({ _id: new ObjectId(id) }, { $set: { status: status } });
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

    const ticketDetails = await ticketDetailModel.find({ ticketId: new ObjectId(ticketId) });

    const ticketProducts = await ticketProductDetail.find({ ticketId: new ObjectId(ticketId) });

    let showtimeInfo = null;
    if (ticket.showtimeId) {
      const showtimes = await GET_DB().collection('showtimes').findOne({ _id: new ObjectId(ticket.showtimeId) });
      showtimeInfo = showtimes;
    }

    return {
      _id: ticket._id,
      customer: ticket.customer,
      code: ticket.code,
      totalAmount: ticket.totalAmount,
      details: {
        ticket_details: ticketDetails,
        product_details: ticketProducts,
      },
      showtime: showtimeInfo,
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
  create,
  findOne,
  findOneById,
  getDelete,
  updateTotalAmount,
  updateStatus,
  getDetailAfterPayment,
  getDetails,
  updateOne
}