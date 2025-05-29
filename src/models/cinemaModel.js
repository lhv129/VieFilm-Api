import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { provinceModel } from "./provinceModel";

const CINEMA_COLLECTION_NAME = "cinemas";
const CINEMA_COLLECTION_SCHEMA = Joi.object({
    provinceId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string().required().min(3).max(30).trim().strict(),
    address: Joi.string().min(5).max(100).trim().default(null),
    images: Joi.string().max(255).trim().default(null),
    fileImage: Joi.string().max(255).trim().strict().default(null),
    slug: Joi.string().required().min(3).trim().strict(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
    try {
        const cinemas = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .find({ _deletedAt: false })
            .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo createdAt
            .toArray();

        return cinemas;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    return await CINEMA_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        // Ép kiểu provinceId thành objectID
        if (typeof validData.provinceId === "string") {
            validData.provinceId = new ObjectId(validData.provinceId);
        }
        const cinema = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .insertOne(validData);
        return cinema;
    } catch (error) {
        throw new Error(error);
    }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
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
            .collection(CINEMA_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const getDetails = async (slug) => {
    try {
        const result = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .aggregate([
                {
                    $match: {
                        slug: slug,
                        _deletedAt: false,
                    },
                },
                {
                    $lookup: {
                        from: provinceModel.PROVINCE_COLLECTION_NAME,
                        localField: "provinceId",
                        foreignField: "_id",
                        as: "province",
                    },
                },
                {
                    $unwind: "$province", // Nếu bạn muốn vai trò là một object thay vì một mảng
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
        // Kiểm tra xem name mới có bị trùng với bản ghi khác không, ngoại trừ bản ghi đang cập nhật
        if (data.name) {
            const existingCinema = await GET_DB()
                .collection(CINEMA_COLLECTION_NAME)
                .findOne({
                    name: data.name,
                    _id: { $ne: new ObjectId(id) },
                });
            if (existingCinema) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên chức vụ đã có, vui lòng chọn tên khác");
            }
        }

        // Ép kiểu provinceId thành objectID
        if (typeof data.provinceId === "string") {
            data.provinceId = new ObjectId(data.provinceId);
        }

        // Cập nhật bản ghi
        const cinema = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return cinema;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const cinema = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .updateOne({ slug: slug }, { $set: { _deletedAt: true } });
        return cinema;
    } catch (error) {
        throw new Error(error);
    }
};

const getAllByProvince = async (provinceId) => {
    try {
        if (!ObjectId.isValid(provinceId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Province ID không hợp lệ!");
        }
        const cinemas = await GET_DB()
            .collection(CINEMA_COLLECTION_NAME)
            .find({ provinceId: new ObjectId(provinceId), _deletedAt: false })
            .toArray();
        return cinemas;
    } catch (error) {
        throw new Error(error);
    }
}

export const cinemaModel = {
    CINEMA_COLLECTION_NAME,
    CINEMA_COLLECTION_SCHEMA,
    getAll,
    create,
    findOneById,
    findOne,
    getDetails,
    update,
    getDelete,
    getAllByProvince
};
