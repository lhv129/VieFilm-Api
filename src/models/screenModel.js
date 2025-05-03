import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError";
import { cinemaModel } from "./cinemaModel";

const SCREEN_COLLECTION_NAME = "screens";
const SCREEN_COLLECTION_SCHEMA = Joi.object({
    cinemaId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string().required().min(3).max(30).trim().strict(),
    screenCode: Joi.string().required().trim().strict(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
    try {
        const screens = await GET_DB().collection(SCREEN_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
        return screens;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    return await SCREEN_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        // Ép kiểu cinemaId thành objectID
        if (typeof validData.cinemaId === "string") {
            validData.cinemaId = new ObjectId(validData.cinemaId);
        }
        const screens = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .insertOne(validData);
        return screens;
    } catch (error) {
        throw new Error(error);
    }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
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
            .collection(SCREEN_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const getDetails = async (id) => {
    try {
        const result = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(id),
                        _deletedAt: false,
                    },
                },
                {
                    $lookup: {
                        from: cinemaModel.CINEMA_COLLECTION_NAME,
                        localField: "cinemaId",
                        foreignField: "_id",
                        as: "cinema",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        cinemaId: 1,
                        name: 1,
                        screenCode: 1,
                        createdAt:1,
                        updatedAt:1,
                        cinema: {
                            _id: 1,
                            name: 1,
                        }
                    }
                },
                {
                    $unwind: "$cinema", // Nếu bạn muốn vai trò là một object thay vì một mảng
                },
            ])
            .toArray();

        return result[0] || {};
    } catch (error) {
        throw new Error(error);
    }
}

const update = async (id, data) => {
    try {
        delete data.screenId;
        // Kiểm tra xem screenCode mới có bị trùng với bản ghi khác không, ngoại trừ bản ghi đang cập nhật
        if (data.screenCode) {
            const existingScreen = await GET_DB()
                .collection(SCREEN_COLLECTION_NAME)
                .findOne({
                    screenCode: data.screenCode,
                    _id: { $ne: new ObjectId(id) },
                });
            if (existingScreen) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `${data.name} đã tồn tại trong rạp này rồi`);
            }
        }

        if (typeof data.cinemaId === "string") {
            data.cinemaId = new ObjectId(data.cinemaId);
        }
        const screen = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });
        return screen;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (id) => {
    try {
        const screen = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: true } });
        return screen;
    } catch (error) {
        throw new Error(error);
    }
};

const getAllByCinema = async (cinemaId) => {
    try {
        if (!ObjectId.isValid(cinemaId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Cinema ID không hợp lệ!");
        }
        const screens = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .find({ cinemaId: new ObjectId(cinemaId), _deletedAt: false })
            .toArray();
        return screens;
    } catch (error) {
        throw new Error(error);
    }
}

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(SCREEN_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

export const screenModel = {
    SCREEN_COLLECTION_NAME,
    SCREEN_COLLECTION_SCHEMA,
    getAll,
    create,
    findOneById,
    findOne,
    getDetails,
    update,
    getDelete,
    getAllByCinema,
    find
};
