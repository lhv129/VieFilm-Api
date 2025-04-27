import Joi from "joi";
import { convertDateToTimestamp } from "../utils/convertDate";

const createUser = async (req, res, next) => {
  // Tạo điều kiện đúng
  const correctCondition = Joi.object({
    username: Joi.string().required().min(3).max(15).trim().strict(),
    fullname: Joi.string().required().min(5).max(100).trim().strict(),
    email: Joi.string().required().email().trim().strict(),
    password: Joi.string().required().min(5).max(100).trim().strict(),
    password_confirm: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .min(5)
      .max(100)
      .trim()
      .strict(),
    status: Joi.string()
      .valid("active", "inactive", "block")
      .default("inactive"),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    update: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
  });

  try {
    // abortEarly: false -> để trả về tất cả lỗi validation
    await correctCondition.validateAsync(req.body, { abortEarly: false });
    // Validation dữ liệu hợp lệ thì cho next request sang controller
    next();
  } catch (error) {
    const errors = error.details.map((data) => ({
      field: data.context.key, // Lấy tên trường bị lỗi
      message: data.message, // Lấy thông báo lỗi
    }));
    res.status(422).json({statusCode:422,message:"Lỗi validation",errors: errors });
  }
};

const updateUser = async (req, res, next) => {

  delete req.body.images;

  const correctCondition = Joi.object({
    roleId: Joi.string().required(),
    username: Joi.string().required().min(3).max(15).trim().strict(),
    fullname: Joi.string().required().min(5).max(100).trim().strict(),
    phone: Joi.string()
      .pattern(/^(0|\+84)(\d){9,10}$/)
      .trim()
      .strict()
      .required(),
    email: Joi.string().required().email().trim().strict(),
    birthday: Joi.string().required(),
    address: Joi.string().min(5).max(100).trim().required().trim().strict(),
    status: Joi.string().valid("active", "inactive", "block").required(),
    createdAt: Joi.date().timestamp("javascript"),
    update: Joi.date().timestamp("javascript").default(Date.now),
    _deletedAt: Joi.boolean(),
  });
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.details.map((data) => ({
      field: data.context.key, // Lấy tên trường bị lỗi
      message: data.message, // Lấy thông báo lỗi
    }));
    res.status(422).json({ errors: errors });
  }
};

export const userValidation = {
  createUser,
  updateUser,
};
