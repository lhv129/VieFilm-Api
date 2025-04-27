import Joi from "joi";

const createProduct = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().required().min(3).max(50).trim().strict().messages({
            "string.empty": "Tên sản phẩm không được để trống",
            "string.required": "Vui lòng nhập tên sản phẩm",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        images: Joi.string().min(3).max(255).trim().strict().messages({
            "string.empty": "Ảnh sản phẩm không được để trống",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        description: Joi.string().required().min(50).max(300).trim().strict().messages({
            "string.empty": "Mô tả combo không được để trống",
            "string.required": "Vui lòng nhập mô tả combo",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        price: Joi.number().required().messages({
            "number.empty": "Gía sản phẩm không được để trống",
            "number.required": "Vui lòng nhập gía sản phẩm",
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


export const productValidation = {
    createProduct,
}
