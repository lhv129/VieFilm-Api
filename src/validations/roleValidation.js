import Joi from "joi";

const createRole = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(3).max(50).trim().strict(),
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

export const roleValidation = {
    createRole
}
