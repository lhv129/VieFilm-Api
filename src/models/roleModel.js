import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "@/config/mongodb";
import { StatusCodes } from "http-status-codes";
import ApiError from "@/utils/ApiError";

const ROLE_COLLECTION_NAME = "roles";
const ROLE_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(15).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _deletedAt: Joi.boolean().default(false),
});

const getAll = async () => {
  try {
    const roles = await GET_DB()
      .collection(ROLE_COLLECTION_NAME)
      .find({ _deletedAt: false })
      .toArray();
    return roles;
  } catch (error) {
    throw new Error(error);
  }
};

const validateBeforeCreate = async (data) => {
  return await ROLE_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const create = async (data) => {
  try {
    const validData = await validateBeforeCreate(data);
    const createdRole = await GET_DB()
      .collection(ROLE_COLLECTION_NAME)
      .insertOne(validData);
    return createdRole;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(ROLE_COLLECTION_NAME)
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
      .collection(ROLE_COLLECTION_NAME)
      .findOne(filter);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const updateRole = async (roleId, newRole) => {
  try {
    // Kiểm tra xem name mới có bị trùng với bản ghi khác không, ngoại trừ bản ghi đang cập nhật
    if (newRole.name) {
      const existingRole = await GET_DB()
        .collection(ROLE_COLLECTION_NAME)
        .findOne({
          name: newRole.name,
          _id: { $ne: new ObjectId(roleId) },
        });
      if (existingRole) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,"Tên chức vụ đã có, vui lòng chọn tên khác");
      }
    }

    // Cập nhật bản ghi
    const updatedRole = await GET_DB()
      .collection(ROLE_COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(roleId) }, { $set: newRole });

    return updatedRole;
  } catch (error) {
    throw error;
  }
};

const getDelete = async (slug) => {
  try {
    const result = await GET_DB()
      .collection(ROLE_COLLECTION_NAME)
      .deleteOne({
        slug: slug,
      });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const roleModel = {
  ROLE_COLLECTION_NAME,
  ROLE_COLLECTION_SCHEMA,
  getAll,
  create,
  findOneById,
  findOne,
  updateRole,
  getDelete,
};
