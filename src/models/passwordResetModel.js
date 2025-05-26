import Joi from "joi";
import { GET_DB } from "../config/mongodb";

// Collection name
const PASSWORD_RESET_COLLECTION_NAME = "password_resets";

// Joi Schema
const PASSWORD_RESET_COLLECTION_SCHEMA = Joi.object({
    email: Joi.string().required().email().trim(),
    token: Joi.string().required().min(10).max(255).trim(),
    expires_at: Joi.date().timestamp("javascript").required(),
    created_at: Joi.date().timestamp("javascript").default(null),
    updated_at: Joi.date().timestamp("javascript").default(null)
});

// Validate before insert
const validateBeforeCreate = async (data) => {
    return await PASSWORD_RESET_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false
    });
};

// Create new reset token
const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        const result = await GET_DB()
            .collection(PASSWORD_RESET_COLLECTION_NAME)
            .insertOne(validData);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

// Find 
const findOne = async (filter) => {
    try {
        const result = await GET_DB()
            .collection(PASSWORD_RESET_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

// Delete token
const deleteOne = async (filter) => {
    try {
        const result = await GET_DB()
            .collection(PASSWORD_RESET_COLLECTION_NAME)
            .deleteMany(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

export const passwordResetModel = {
    PASSWORD_RESET_COLLECTION_NAME,
    PASSWORD_RESET_COLLECTION_SCHEMA,
    create,
    findOne,
    deleteOne
};
