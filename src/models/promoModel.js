// promoModel.js
import Joi from "joi";
import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";

const PROMO_COLLECTION_NAME = "promocodes";
const PROMO_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(5).trim().strict(),
  price: Joi.number().required().min(0),
  description: Joi.string().allow('').default(''),
  status: Joi.string().valid('active', 'inactive').default('inactive'),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required(),
  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _deletedAt: Joi.boolean().default(false),
});

const validateBeforeCreate = async (data) => {
  return await PROMO_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false });
};

const getAll = async () => {
  return await GET_DB().collection(PROMO_COLLECTION_NAME).find({ _deletedAt: false }).toArray();
};

const create = async (data) => {
  const validData = await validateBeforeCreate(data);
  return await GET_DB().collection(PROMO_COLLECTION_NAME).insertOne(validData);
};

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(PROMO_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id),
      });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const findOne = async (filter) => {
  return await GET_DB().collection(PROMO_COLLECTION_NAME).findOne(filter);
};

const updatePromo = async (promoId, newData) => {
  const validData = await validateBeforeCreate(newData);
  validData.updatedAt = new Date(validData.updatedAt).getTime();
  return await GET_DB()
    .collection(PROMO_COLLECTION_NAME)
    .updateOne({ _id: new ObjectId(promoId) }, { $set: validData });
};

const deletePromo = async (promoId) => {
  return await GET_DB().collection(PROMO_COLLECTION_NAME).deleteOne({ _id: new ObjectId(promoId) });
};

const find = async (filter) => {
  try {
    const results = await GET_DB()
      .collection(PROMO_COLLECTION_NAME)
      .find(filter).toArray();
    return results;
  } catch (error) {
    throw new Error(error);
  }
};

export const promoModel = {
  PROMO_COLLECTION_NAME,
  PROMO_COLLECTION_SCHEMA,
  getAll,
  create,
  findOneById,
  findOne,
  updatePromo,
  deletePromo,
  find
};
