import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";

const createSeat = async (req, res, next) => {
    const correctCondition = Joi.object({
        screenId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).messages({
            "string.empty": "screenId không được để trống",
            "any.required": "Vui lòng nhập screenId",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        startRow: Joi.string().required().trim().strict().messages({
            "string.empty": "Hàng ghế bắt đầu không được để trống",
            "any.required": "Vui lòng nhập hàng ghế bắt đầu",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        endRow: Joi.string().required().trim().strict().messages({
            "string.empty": "Hàng ghế kết thúc không được để trống",
            "any.required": "Vui lòng nhập hàng ghế kết thúc",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        number: Joi.number().required().min(0).max(25).messages({
            "number.empty": "Số lượng ghế không được để trống",
            "any.required": "Vui lòng nhập số lượng ghế",
            "number.min": "Số ghế bắt đầu từ 1",
            "number.max": "Ghế nhiều nhất phòng có thể chứa là 25",
        }),
        type: Joi.string().required().valid("Ghế thường", "Ghế VIP", "Ghế đôi").messages({
            "string.empty": "Kiểu ghế không được để trống",
            "any.required": "Vui lòng nhập kiểu ghế",
            "string.valid": "Kiểu ghế chỉ có Ghế thường, VIP, đôi",
        }),
        price: Joi.number().required().min(0).max(300000).messages({
            "number.empty": "Gía ghế không được để trống",
            "any.required": "Vui lòng nhập giá ghế",
            "number.min": "Gía ghế không âm",
            "number.max": "Gía ghế nhiều nhất là 300000",
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

const updateSeat = async (req, res, next) => {
    const correctCondition = Joi.object({
        row: Joi.string().required().trim().strict().messages({
            "string.empty": "Hàng ghế không được để trống",
            "any.required": "Vui lòng nhập hàng ghế",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        number: Joi.number().required().min(0).max(25).messages({
            "number.empty": "Số ghế không được để trống",
            "any.required": "Vui lòng nhập số ghế",
            "number.min": "Số ghế bắt đầu từ 1",
            "number.max": "Ghế nhiều nhất phòng có thể chứa là 25",
        }),
        type: Joi.string().required().valid("Ghế thường", "Ghế VIP", "Ghế đôi").messages({
            "string.empty": "Kiểu ghế không được để trống",
            "any.required": "Vui lòng nhập kiểu ghế",
            "string.valid": "Kiểu ghế chỉ có Ghế thường, VIP, đôi",
        }),
        price: Joi.number().required().min(0).max(300000).messages({
            "number.empty": "Gía ghế không được để trống",
            "any.required": "Vui lòng nhập giá ghế",
            "number.min": "Gía ghế không âm",
            "number.max": "Gía ghế nhiều nhất là 300000",
        }),
        status: Joi.string().required().valid("available", "broken").messages({
            "string.empty": "Trạng thái ghế không được để trống",
            "any.required": "Vui lòng nhập trạng thái ghế",
            "string.valid": "Trạng thái ghế chỉ có Ghế thường, VIP, đôi",
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

export const seatValidation = {
    createSeat,
    updateSeat
}
