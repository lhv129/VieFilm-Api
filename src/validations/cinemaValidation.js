import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";

const createCinema = async (req, res, next) => {
    const correctCondition = Joi.object({
        provinceId: Joi.string()
            .required()
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE).messages({
                "string.empty": "Tỉnh thành không được để trống",
                "any.required": "Vui lòng nhập tỉnh thành",
                "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
            }),
        name: Joi.string().required().min(3).max(50).trim().strict().messages({
            "string.empty": "Tên rạp phim không được để trống",
            "string.required": "Vui lòng nhập tên rạp phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "string.min": "Tên rạp tối thiểu 3 kí tự",
            "string.max": "Tên rạp quá dài, vui lòng chọn tên khác",
        }),
        address: Joi.string().required().min(3).max(100).trim().strict().messages({
            "string.empty": "Tên tỉnh thành không được để trống",
            "string.required": "Vui lòng nhập tên tỉnh thành",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        images: Joi.string().min(3).max(255).trim().strict().messages({
            "string.empty": "Ảnh rạp phim không được để trống",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
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

const updateCinema = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().required().min(3).max(50).trim().strict().messages({
            "string.empty": "Tên rạp phim không được để trống",
            "string.required": "Vui lòng nhập tên rạp phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        address: Joi.string().required().min(3).max(100).trim().strict().messages({
            "string.empty": "Tên tỉnh thành không được để trống",
            "string.required": "Vui lòng nhập tên tỉnh thành",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        images: Joi.string().min(3).max(255).trim().strict().messages({
            "string.empty": "Ảnh rạp phim không được để trống",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
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

export const cinemaValidation = {
    createCinema,
    updateCinema
}
