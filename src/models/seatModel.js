import { GET_DB } from "../config/mongodb";
import ApiError from "../utils/ApiError";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import { ObjectId } from "mongodb";

const SEAT_COLLECTION_NAME = "seats";
const SEAT_COLLECTION_SCHEMA = Joi.object({
    screenId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    row: Joi.string().required().trim().strict(),
    number: Joi.number().required().min(0).max(25),
    seatCode: Joi.string().required().trim().strict(),
    type: Joi.string().required().valid("Ghế thường", "Ghế VIP", "Ghế đôi"),
    price: Joi.number().required(),
    status: Joi.string().valid("available", "broken").default("available"),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false)
});

const getAll = async (req, res, next) => {
    try {
        const seats = await GET_DB().collection(SEAT_COLLECTION_NAME)
            .find(
                {
                    _deletedAt: false
                }
            )
            .toArray();
        return seats;
    } catch (error) {
        throw new Error(error);
    }
}

const createSeats = async (screenId, dataArray) => {
    try {
        //Lấy ra danh sách ghế 
        const seatInScreen = await GET_DB().collection(SEAT_COLLECTION_NAME).find({ screenId: new ObjectId(screenId), _deletedAt: false }).toArray();
        // Tạo một Set chứa tất cả các seatCode đã tồn tại trong seatInScreen để kiểm tra nhanh hơn
        const seatCodesDaTonTai = new Set(seatInScreen.map(seat => seat.seatCode));

        // Lọc ra khỏi dataArray những ghế có seatCode không tồn tại trong Set seatCodesDaTonTai
        const gheMoiChuaTonTai = dataArray.filter(gheMoi => !seatCodesDaTonTai.has(gheMoi.seatCode));

        if (gheMoiChuaTonTai.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Ghế đã có trong rạp chiếu, vui lòng kiểm tra lại");
        } else {
            // Chuyển đổi screenId thành ObjectId trước khi insert
            const transformedDataArray = gheMoiChuaTonTai.map(data => ({
                ...data,
                screenId: new ObjectId(data.screenId),
            }));
            await GET_DB().collection(SEAT_COLLECTION_NAME).insertMany(transformedDataArray);
            return transformedDataArray;
        }
    } catch (error) {
        throw new Error(error);
    }
}

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(SEAT_COLLECTION_NAME)
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
            .collection(SEAT_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const getAllByScreen = async (screenId) => {
    try {
        const result = await GET_DB()
            .collection(SEAT_COLLECTION_NAME)
            .find({ screenId: new ObjectId(screenId), _deletedAt: false })
            .toArray();
        return result;
    } catch (error) {
        throw new Error(error);
    }
}

const update = async (id, data) => {
    try {
        if (data.seatCode) {
            const existingSeat = await GET_DB().collection(SEAT_COLLECTION_NAME).findOne({ seatCode: data.seatCode, _id: { $ne: new ObjectId(id) }, });
            if (existingSeat) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Ghế ${data.seatCode} đã tồn tại, vui lòng kiểm tra lại`);
            }
        }

        const seat = await GET_DB().collection(SEAT_COLLECTION_NAME).updateOne({ _id: new ObjectId(id) }, { $set: data });

        return seat;
    } catch (error) {
        throw new Error(error);
    }
}

const getDelete = async (id) => {
    try {
        const seat = await GET_DB()
            .collection(SEAT_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: true } });
        return seat;
    } catch (error) {
        throw new Error(error);
    }
};

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(SEAT_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

export const seatModel = {
    SEAT_COLLECTION_NAME,
    SEAT_COLLECTION_SCHEMA,
    getAll,
    createSeats,
    findOneById,
    findOne,
    getAllByScreen,
    update,
    getDelete,
    find,
}