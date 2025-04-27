import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError";

const PAYMENT_METHOD_COLLECTION_NAME = "payment_methods";
const PAYMENT_METHOD_COLLECTION_SCHEMA = Joi.object({
    name: Joi.string().required().min(3).max(30).trim().strict(),
    slug: Joi.string().required().min(3).trim().strict(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
    try {
        const paymentMethods = await GET_DB().collection(PAYMENT_METHOD_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
        return paymentMethods;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    return await PAYMENT_METHOD_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        const paymentsMethod = await GET_DB()
            .collection(PAYMENT_METHOD_COLLECTION_NAME)
            .insertOne(validData);
        return paymentsMethod;
    } catch (error) {
        throw new Error(error);
    }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(PAYMENT_METHOD_COLLECTION_NAME)
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
            .collection(PAYMENT_METHOD_COLLECTION_NAME)
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
                .collection(PAYMENT_METHOD_COLLECTION_NAME)
                .findOne({
                    name: data.name,
                    _id: { $ne: new ObjectId(id) },
                });
            if (existingProvince) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Phương thức thanh toán đã có, vui lòng kiểm tra lại");
            }
        }

        // Cập nhật bản ghi
        const paymentMethod = await GET_DB()
            .collection(PAYMENT_METHOD_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return paymentMethod;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const paymentMethod = await GET_DB()
            .collection(PAYMENT_METHOD_COLLECTION_NAME)
            .updateOne({ slug: slug }, { $set: { _deletedAt:true } });
        return paymentMethod;
    } catch (error) {
        throw new Error(error);
    }
};

export const paymentMethodModel = {
    PAYMENT_METHOD_COLLECTION_NAME,
    PAYMENT_METHOD_COLLECTION_SCHEMA,
    getAll,
    create,
    findOneById,
    findOne,
    update,
    getDelete,
};
