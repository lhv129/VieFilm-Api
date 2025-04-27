import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError";

const PRODUCT_COLLECTION_NAME = "products";
const PRODUCT_COLLECTION_SCHEMA = Joi.object({
    name: Joi.string().required().min(3).max(100).trim().strict(),
    images: Joi.string().max(255).trim().default(null),
    description: Joi.string().required().min(50).max(300).trim().strict(),
    price: Joi.number().required(),
    fileImage: Joi.string().max(255).trim().strict().default(null),
    status: Joi.string().valid("active", "inactive").default("inactive"),
    slug: Joi.string().required().min(3).trim().strict(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
    try {
        const products = await GET_DB().collection(PRODUCT_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
        return products;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    return await PRODUCT_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        const product = await GET_DB()
            .collection(PRODUCT_COLLECTION_NAME)
            .insertOne(validData);
        return product;
    } catch (error) {
        throw new Error(error);
    }
};

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(PRODUCT_COLLECTION_NAME)
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
            .collection(PRODUCT_COLLECTION_NAME)
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
            const existingProduct = await GET_DB()
                .collection(PRODUCT_COLLECTION_NAME)
                .findOne({
                    name: data.name,
                    _id: { $ne: new ObjectId(id) },
                });
            if (existingProduct) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên combo đã có, vui lòng kiểm tra lại");
            }
        }

        // Cập nhật bản ghi
        const product = await GET_DB()
            .collection(PRODUCT_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return product;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const product = await GET_DB()
            .collection(PRODUCT_COLLECTION_NAME)
            .updateOne({ slug: slug }, { $set: { _deletedAt:true } });
        return product;
    } catch (error) {
        throw new Error(error);
    }
};

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(PRODUCT_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

export const productModel = {
    PRODUCT_COLLECTION_NAME,
    PRODUCT_COLLECTION_SCHEMA,
    getAll,
    create,
    findOneById,
    findOne,
    update,
    getDelete,
    find
};
