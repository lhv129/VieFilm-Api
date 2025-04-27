import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";


const TICKET_DETAIL_COLLECTION_NAME = "ticket_details";
const TICKET_DETAIL_COLLECTION_SCHEMA = Joi.object({
    ticketId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    seatId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    price: Joi.number().required(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const validateBeforeCreateMany = async (dataArray) => {
    return await Promise.all(
        dataArray.map(async (data) => {
            const validatedData = await TICKET_DETAIL_COLLECTION_SCHEMA.validateAsync(data, {
                abortEarly: false,
            });
            return {
                ...validatedData,
                ticketId: new ObjectId(validatedData.ticketId),
                seatId: new ObjectId(validatedData.seatId),
            };
        })
    );
};

const insertMany = async (dataArray) => {
    try {
        const validDataArray = await validateBeforeCreateMany(dataArray);
        const ticketDetails = await GET_DB()
            .collection(TICKET_DETAIL_COLLECTION_NAME)
            .insertMany(validDataArray);
        return ticketDetails;
    } catch (error) {
        throw new Error(error);
    }
};

const getTotalPriceTicketDetails = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(TICKET_DETAIL_COLLECTION_NAME)
            .find(filter).toArray();

        // Calculate the total price by summing the 'price' of each record
        const totalPrice = results.reduce((sum, record) => sum + record.price, 0);
        return totalPrice;
    } catch (error) {
        throw new Error(error);
    }
};

async function getTicketDetailsWithPriceFromSeats(ticketId, seatIds) {
    try {
        const db = await GET_DB();
        const seatsCollection = db.collection("seats");

        // Tạo một mảng các promises để lấy thông tin của từng ghế
        const seatPromises = seatIds.map(async (seatId) => {
            const seat = await seatsCollection.findOne({ _id: new ObjectId(seatId), _deletedAt: false, status: "available" });
            return { ticketId: ticketId, seatId: seatId, price: seat.price };
        });

        // Chờ cho tất cả các promises hoàn thành
        const ticketDetails = await Promise.all(seatPromises);

        // Lọc bỏ các kết quả null (nếu có ghế không tìm thấy hoặc không có giá)
        return ticketDetails.filter(detail => detail !== null);

    } catch (error) {
        console.error("Lỗi khi truy vấn thông tin ghế:", error);
        return []; // Trả về một mảng trống trong trường hợp có lỗi
    }
}

const deleteMany = async (filter) => {
    try {
        const result = await GET_DB()
            .collection(TICKET_DETAIL_COLLECTION_NAME)
            .deleteMany(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(TICKET_DETAIL_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

export const ticketDetailModel = {
    TICKET_DETAIL_COLLECTION_NAME,
    TICKET_DETAIL_COLLECTION_SCHEMA,
    insertMany,
    getTicketDetailsWithPriceFromSeats,
    getTotalPriceTicketDetails,
    deleteMany,
    find
}