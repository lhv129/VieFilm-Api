import Joi from "joi";

const loginValidation = async (req, res, next) => {
    const correctCondition = Joi.object({
        email: Joi.string()
            .required()
            .email()
            .trim()
            .strict()
            .messages({
                "string.base": `Email phải là một chuỗi`,
                "string.empty": `Email không được để trống`,
                "string.email": `Email không đúng định dạng`,
                "any.required": `Email là bắt buộc`,
            }),
        password: Joi.string()
            .required()
            .trim()
            .strict()
            .messages({
                "string.base": `Mật khẩu phải là một chuỗi`,
                "string.empty": `Mật khẩu không được để trống`,
                "any.required": `Mật khẩu là bắt buộc`,
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
            message: data.message,
        }));
        res.status(422).json({ statusCode: 422, message: "Lỗi validation", errors: errors });
    }
};

const registerValidation = async (req, res, next) => {
    const correctCondition = Joi.object({
        username: Joi.string().required().min(3).max(15).trim().strict().messages({
            "string.base": `Tên người dùng phải là một chuỗi`,
            "string.empty": `Tên người dùng không được để trống`,
            "string.min": `Tên người dùng phải có ít nhất {#limit} ký tự`,
            "string.max": `Tên người dùng không được dài hơn {#limit} ký tự`,
            "any.required": `Tên người dùng là bắt buộc`,
        }),
        fullname: Joi.string().required().min(5).max(100).trim().strict().messages({
            "string.base": `Tên người dùng phải là một chuỗi`,
            "string.empty": `Tên người dùng không được để trống`,
            "string.min": `Tên người dùng phải có ít nhất {#limit} ký tự`,
            "string.max": `Tên người dùng không được dài hơn {#limit} ký tự`,
            "any.required": `Tên người dùng" là bắt buộc`,
        }),
        email: Joi.string().required().email().trim().strict().messages({
            "string.base": `Email phải là một chuỗi`,
            "string.empty": `Email không được để trống`,
            "string.email": `Email không đúng định dạng`,
            "any.required": `Email là bắt buộc`,
        }),
        password: Joi.string().required().min(5).max(100).trim().strict().messages({
            "string.base": `Mật khẩu phải là một chuỗi`,
            "string.empty": `Mật khẩu không được để trống`,
            "string.min": `Mật khẩu phải có ít nhất {#limit} ký tự`,
            "string.max": `Mật khẩu không được dài hơn {#limit} ký tự`,
            "any.required": `Mật khẩu là bắt buộc`,
        }),
        password_confirm: Joi.string()
            .valid(Joi.ref("password")).required().min(5).max(100).trim().strict()
            .messages({
                "any.only": `Xác nhận mật khẩu phải khớp với mật khẩu`,
                "string.empty": `Xác nhận mật khẩu" không được để trống`,
                "any.required": `Xác nhận mật khẩu" là bắt buộc`,
            }),
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
            message: data.message,
        }));
        res.status(422).json({ statusCode: 422, message: "Lỗi validation", errors: errors });
    }
}

export const authValidation = {
    loginValidation,
    registerValidation
}
