import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError";

const PROVINCE_COLLECTION_NAME = "provinces";
const PROVINCE_COLLECTION_SCHEMA = Joi.object({
    name: Joi.string().required().min(3).max(30).trim().strict(),
    slug: Joi.string().required().min(3).trim().strict(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
    try {
        const provinces = await GET_DB().collection(PROVINCE_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
        return provinces;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    return await PROVINCE_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        const province = await GET_DB()
            .collection(PROVINCE_COLLECTION_NAME)
            .insertOne(validData);
        return province;
    } catch (error) {
        throw new Error(error);
    }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(PROVINCE_COLLECTION_NAME)
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
            .collection(PROVINCE_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const update = async (id, data) => {
    try {
        // Kiểm tra xem name mới có bị trùng với bản ghi khác không, ngoại trừ bản ghi đang cập nhật
        if (data.name) {
            const existingProvince = await GET_DB()
                .collection(PROVINCE_COLLECTION_NAME)
                .findOne({
                    name: data.name,
                    _id: { $ne: new ObjectId(id) },
                });
            if (existingProvince) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên chức vụ đã có, vui lòng chọn tên khác");
            }
        }

        // Cập nhật bản ghi
        const province = await GET_DB()
            .collection(PROVINCE_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return province;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const province = await GET_DB()
            .collection(PROVINCE_COLLECTION_NAME)
            .updateOne({ slug: slug }, { $set: { _deletedAt:true } });
        return province;
    } catch (error) {
        throw new Error(error);
    }
};

export const provinceModel = {
    PROVINCE_COLLECTION_NAME,
    PROVINCE_COLLECTION_SCHEMA,
    getAll,
    create,
    findOneById,
    findOne,
    update,
    getDelete,
};
