import Joi from "joi";

const createProduct = async (req, res, next) => {
    const correctCondition = Joi.object({
        name: Joi.string().required().min(3).max(50).trim().strict().messages({
            "string.empty": "Tên sản phẩm không được để trống",
            "any.required": "Vui lòng nhập tên sản phẩm",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "string.min": "Tên sản phẩm quá ngắn, vui lòng kiểm tra lại",
            "string.max": "Tên sản phẩm quá dài, vui lòng chọn tên khác",
        }),
        images: Joi.string().min(3).max(255).trim().strict().messages({
            "string.empty": "Ảnh sản phẩm không được để trống",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        description: Joi.string().required().min(50).max(300).trim().strict().messages({
            "string.empty": "Mô tả combo không được để trống",
            "any.required": "Vui lòng nhập mô tả combo",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "string.min": "Mô tả sản phẩm quá ngắn, vui lòng kiểm tra lại",
            "string.max": "Mô tả sản phẩm quá dài, vui lòng chọn tên khác",
        }),
        status: Joi.string().required().valid('active', 'inactive').trim().strict().messages({
            "string.empty": "Trạng thái combo không được để trống",
            "any.required": "Vui lòng nhập trạng thái",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "any.only": "Trạng thái phải là active hoặc inactive"
        }),
        price: Joi.number().required().min(0).max(500000).messages({
            "any.required": "Vui lòng nhập giá sản phẩm",
            "number.base": "Giá sản phẩm phải là một số",
            "number.min": "Giá sản phẩm không được nhỏ hơn 0",
            "number.max": "Giá sản phẩm không được vượt quá 500000"
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
