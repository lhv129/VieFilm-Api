import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";
import { roleModel } from "../models/roleModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const USER_COLLECTION_NAME = "users";
const USER_COLLECTION_SCHEMA = Joi.object({
  roleId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  username: Joi.string().required().min(3).max(15).trim().strict(),
  fullname: Joi.string().required().min(5).max(100).trim().strict(),
  email: Joi.string().required().email().trim().strict(),
  password: Joi.string().min(5).max(100).trim().strict(),
  phone: Joi.string()
    .pattern(/^(0|\+84)(\d){9,10}$/)
    .trim()
    .strict()
    .default(null),
  address: Joi.string().min(5).max(100).trim().default(null),
  birthday: Joi.date().timestamp("javascript").default(null),
  images: Joi.string().max(255).trim().default(null),
  fileImage: Joi.string().max(255).trim().strict().default(null),
  status: Joi.string().valid("active", "inactive", "block").default("inactive"),
  remember_token: Joi.string().min(5).max(255),
  refresh_token: Joi.string().min(5).max(255).default(null),
  expired_refresh_token: Joi.date().timestamp("javascript").default(null),
  email_verified_at: Joi.date().timestamp("javascript").default(null),
  email_verification_token: Joi.string().default(null),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
  try {
    const users = await GET_DB().collection(USER_COLLECTION_NAME)
      .find(
        { _deletedAt: false },
        { projection: { _id: 1, username: 1, username: 1, fullname: 1, email: 1, roleId: 1, images: 1, fileImage: 1, phone: 1, address: 1, birthday: 1, status: 1, email_verified_at: 1 } }
      )
      .toArray();
    return users;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const create = async (user) => {
  try {
    const validData = await validateBeforeCreate(user);
    // Ép kiểu roleId thành objectID
    if (typeof validData.roleId === "string") {
      validData.roleId = new ObjectId(validData.roleId);
    }
    const createdUser = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validData);
    return createdUser;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { _id: 1, username: 1, username: 1, fullname: 1, email: 1, roleId: 1, images: 1, fileImage: 1, phone: 1, address: 1, birthday: 1, status: 1, email_verified_at: 1 } }
      );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const findOne = async (filter) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne(filter);

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getDetails = async (userId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(userId),
            _deletedAt: false,
          },
        },
        {
          $lookup: {
            from: roleModel.ROLE_COLLECTION_NAME,
            localField: "roleId",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            fullname: 1,
            email: 1,
            images: 1,
            phone: 1,
            address: 1,
            birthday: 1,
            fileImage: 1,
            status: 1,
            roleId: 1,
            role: {
              _id: 1,
              name: 1,
            }
          }
        },
        {
          $unwind: "$role", // Nếu bạn muốn vai trò là một object thay vì một mảng
        },
      ])
      .toArray();

    return result[0] || {};
  } catch (error) {
    throw new Error(error);
  }
};

const updatedUser = async (userId, newUser) => {
  try {
    // Kiểm tra xem username và email mới có bị trùng với bản ghi khác không, ngoại trừ bản ghi đang cập nhật
    if (newUser) {
      const existingUsername = await GET_DB()
        .collection(USER_COLLECTION_NAME)
        .findOne({
          username: newUser.username,
          _id: { $ne: new ObjectId(userId) },
        });
      const existingUserEmail = await GET_DB()
        .collection(USER_COLLECTION_NAME)
        .findOne({
          email: newUser.email,
          _id: { $ne: new ObjectId(userId) },
        });

      if (existingUsername && existingUserEmail) {
        throw new ApiError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          "Username and Email already exists"
        );
      } else if (existingUsername) {
        throw new ApiError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          "Username already exists!"
        );
      } else if (existingUserEmail) {
        throw new ApiError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          "Email already exists!"
        );
      }
    }

    // Cập nhật bản ghi
    const updatedUser = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(userId) }, { $set: newUser });

    return updatedUser;
  } catch (error) {
    throw error;
  }
};

const getDelete = async (userId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(userId) }, { $set: { _deletedAt: true } });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const updateRefreshToken = async (id, refreshToken, expiredRefreshToken) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: { refresh_token: refreshToken, expired_refresh_token: expiredRefreshToken } });
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

const updateOne = async (id, data) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: { data } });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  getAll,
  create,
  findOneById,
  findOne,
  getDetails,
  updatedUser,
  getDelete,
  updateRefreshToken,
  updateOne
};
