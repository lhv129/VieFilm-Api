import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";


const staffCreateTicket = async (req, res, next) => {
    const correctCondition = Joi.object({
        userId: Joi.string()
            .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
        cinemaId: Joi.string()
            .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
        showtimeId: Joi.string()
            .required()
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE).messages({
                "string.empty": "Suất chiếu không được để trống",
                "any.required": "Vui lòng nhập suất chiếu (showtimeId)",
                "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
            }),
        promoCodeId: Joi.string()
            .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
        paymentMethodId: Joi.string()
            .required()
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE).messages({
                "string.empty": "Phương thức thanh toán không được để trống",
                "any.required": "Vui lòng chọn phương thức thanh toán",
                "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
            }),
        products: Joi.array()
            .allow(null, ''),
        staff: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
        customer: Joi.string().required().min(5).max(100).trim().strict().messages({
            "string.empty": "Tên khách hàng không được để trống",
            "any.required": "Vui lòng nhập tên khách hàng",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        seatIds: Joi.array().required().messages({
            "any.required": "Vui lòng nhập Ghế (seatIds)",
        }),
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
        res.status(422).json({ statusCode: 422, message: "Lỗi validation", errors: errors });
    }
};

const create = async (req, res, next) => {
    const correctCondition = Joi.object({
        userId: Joi.string()
            .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
        showtimeId: Joi.string()
            .required()
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE).messages({
                "string.empty": "Suất chiếu không được để trống",
                "any.required": "Vui lòng nhập suất chiếu (showtimeId)",
                "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
            }),
        promoCodeId: Joi.string()
            .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
        paymentMethodId: Joi.string()
        .allow(null, '')
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE).messages({
                "string.empty": "Phương thức thanh toán không được để trống",
                "any.required": "Vui lòng chọn phương thức thanh toán",
                "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
            }),
        products: Joi.array()
            .allow(null, ''),
        staff: Joi.string().allow(null, '').min(5).max(100).trim().strict(),
        customer: Joi.string().min(5).max(100).trim().strict(),
        seatIds: Joi.array().required().messages({
            "any.required": "Vui lòng nhập Ghế (seatIds)",
        }),
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
        res.status(422).json({ statusCode: 422, message: "Lỗi validation", errors: errors });
    }
};

export const ticketValidation = {
    staffCreateTicket,
    create
}
