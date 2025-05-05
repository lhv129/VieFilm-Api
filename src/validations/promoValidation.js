import Joi from "joi";

const createPromo = async (req, res, next) => {
  const schema = Joi.object({
    description: Joi.string().required().min(10).max(100).trim().strict(),
    price: Joi.number().required().min(0).max(200000),
    status: Joi.string().valid('active', 'inactive').default('inactive'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref("startDate")).required()
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.details.map((data) => ({
      field: data.context.key,
      message: data.message,
    }));
    res.status(422).json({ statusCode: 422, message: "Lỗi validation", errors });
  }
};

export const promoValidation = {
  createPromo
};
