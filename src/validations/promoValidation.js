import Joi from "joi";
import dayjs from "dayjs";

const createPromo = async (req, res, next) => {
  // Thời gian hiện tại
  const now = dayjs();
  const oneMonthAgo = now.subtract(1, 'month').toDate();
  const oneMonthLater = now.add(1, 'month').toDate();

  const correctCondition = Joi.object({
    description: Joi.string()
      .required()
      .min(10)
      .max(100)
      .trim()
      .strict()
      .messages({
        'string.base': 'Mô tả phải là chuỗi ký tự',
        'string.empty': 'Mô tả không được để trống',
        'string.min': 'Mô tả phải có ít nhất {#limit} ký tự',
        'string.max': 'Mô tả không được vượt quá {#limit} ký tự',
        'any.required': 'Mô tả là bắt buộc'
      }),
    price: Joi.number()
      .required()
      .min(0)
      .max(200000)
      .messages({
        'number.base': 'Giá phải là số',
        'number.min': 'Giá không được nhỏ hơn {#limit}',
        'number.max': 'Giá không được lớn hơn {#limit}',
        'any.required': 'Giá là bắt buộc'
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .default('inactive')
      .messages({
        'any.only': 'Trạng thái chỉ được là "active" hoặc "inactive"',
      }),
    startDate: Joi.date()
      .iso()
      .required()
      .min(oneMonthAgo)
      .max(oneMonthLater)
      .messages({
        'date.base': 'Ngày bắt đầu phải là ngày hợp lệ',
        'date.format': 'Ngày bắt đầu phải đúng định dạng ISO',
        'date.min': `Ngày bắt đầu không được trước hơn 1 tháng so với hôm nay`,
        'date.max': `Ngày bắt đầu không được sau quá 1 tháng so với hôm nay`,
        'any.required': 'Ngày bắt đầu là bắt buộc',
      }),
    endDate: Joi.date()
      .iso()
      .required()
      .greater(Joi.ref('startDate'))
      .custom((value, helpers) => {
        const start = dayjs(helpers.state.ancestors[0].startDate);
        const end = dayjs(value);
        if (end.diff(start, 'month', true) > 2) {
          return helpers.error('date.range');
        }
        return value;
      })
      .messages({
        'date.base': 'Ngày kết thúc phải là ngày hợp lệ',
        'date.format': 'Ngày kết thúc phải đúng định dạng ISO',
        'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
        'date.range': 'Ngày kết thúc không được vượt quá 2 tháng kể từ ngày bắt đầu',
        'any.required': 'Ngày kết thúc là bắt buộc',
      }),
  });

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.details.map((data) => ({
      field: data.context.key,
      message: data.message,
    }));
    res.status(422).json({
      statusCode: 422,
      message: "Dữ liệu không hợp lệ",
      errors,
    });
  }
};

export const promoValidation = {
  createPromo,
};
