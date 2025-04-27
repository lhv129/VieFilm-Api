import Joi from "joi";

const createProvince = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().required().min(3).max(50).trim().strict().messages({
            "string.empty": "Tên tỉnh thành không được để trống",
            "any.required": "Vui lòng nhập tên tỉnh thành",
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

export const provinceValidation = {
    createProvince
}
