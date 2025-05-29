import Joi from "joi";
import { convertDateToTimestamp } from "../utils/convertDate";


const createMovie = async (req, res, next) => {

    const allowedLanguages = [
        "Tiếng Anh",
        "Tiếng Trung",
        "Tiếng Việt"
    ];

    const correctCondition = Joi.object({
        title: Joi.string().required().min(5).max(100).trim().strict().messages({
            "string.empty": "Tiêu đề phim thành không được để trống",
            "any.required": "Vui lòng nhập tiêu đề phim thành",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        description: Joi.string().required().min(100).max(1000).trim().strict().messages({
            "string.empty": "Miêu tả phim thành không được để trống",
            "any.required": "Vui lòng nhập miêu tả phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "string.min": "Mô tả phim quá ngắn",
            "string.max": "Mô tả phim quá dài",
        }),
        trailer: Joi.string().required().trim().strict().messages({
            "string.empty": "Trailer phim không được để trống",
            "any.required": "Vui lòng nhập trailer phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        poster: Joi.string().messages({
            "string.empty": "Poster phim không được để trống",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối"
        }),
        directors: Joi.string().required().custom((value, helpers) => {
            if (value) {
                const directorsArray = value.split(',').map(director => director.trim());
                if (directorsArray.length > 2) {
                    return helpers.error('string.maxParts', { limit: 2 });
                }
            }
            return value;
        }).messages({
            "string.empty": "Đạo diễn phim không được để trống",
            "any.required": "Vui lòng nhập đạo diễn phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            'string.maxParts': 'Chỉ được nhập tối đa 2 đạo diễn, cách nhau bằng dấu phẩy.',
        }),
        actors: Joi.string().trim().allow('').optional().custom((value, helpers) => {
            if (value) {
                const actorsArray = value.split(',').map(actor => actor.trim());
                if (actorsArray.length > 10) {
                    return helpers.error('string.maxParts', { limit: 10 });
                }
            }
            return value;
        }).max(250).messages({
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            'string.maxParts': 'Chỉ được nhập tối đa 10 thể diễn viên, cách nhau bằng dấu phẩy.',
            "string.max": "Diễn viên quá dài, vui lòng nhập ngắn lại",
        }),
        genres: Joi.string().required().trim().strict().custom((value, helpers) => {
            if (value) {
                const genresArray = value.split(',').map(genres => genres.trim());
                if (genresArray.length > 2) {
                    return helpers.error('string.maxParts', { limit: 2 });
                }
            }
            return value;
        }).messages({
            "string.empty": "Thể loại phim không được để trống",
            "any.required": "Vui lòng nhập thể loại phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            'string.maxParts': 'Chỉ được nhập tối đa 2 thể loại phim, cách nhau bằng dấu phẩy.',
        }),
        language: Joi.string()
            .required()
            .valid(...allowedLanguages)
            .messages({
                "string.empty": "Ngôn ngữ không được để trống",
                "any.required": "Vui lòng nhập ngôn ngữ ghế",
                "any.only": `Ngôn ngữ chỉ được chọn trong danh sách ngôn ngữ hợp lệ: ${allowedLanguages.join(", ")}`,
            }),
        duration: Joi.number().integer().required().min(30).max(200).messages({
            "number.empty": "Thời lượng phim không được để trống",
            "any.required": "Vui lòng nhập thời lượng phim",
            "number.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "number.min": "Thời lượng phim quá ngắn",
            "number.max": "Thời lượng phim quá dài",
        }),
        rating: Joi.number().required().min(0).max(10).messages({
            "number.empty": "Đánh giá của phim không được để trống",
            "any.required": "Vui lòng nhập đánh giá của phim",
            "number.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
            "number.min": "Đánh giá của phim không được âm điểm",
            "number.max": "Đánh giá của phim tối đa là 10 điểm",
        }),
        releaseDate: Joi.string().required().custom((value, helpers) => {
            // Chuyển đổi dd/mm/yyyy sang timestamp
            const realeaseDate = convertDateToTimestamp(req.body.releaseDate);
            const now = new Date();
            // Thời điểm 1 tháng trước từ ngày hôm nay
            const passDate = new Date(now.setMonth(now.getMonth() - 1));
            // Chuyển đổi passDate thành dd/mm/yyyy để thông báo;
            const date = new Date(passDate);
            const dateString = date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

            if (new Date(realeaseDate) < passDate) {
                return helpers.message(`Thời gian công chiếu phải sau ngày ${dateString}`);
            }
            return value;
        }).messages({
            "number.empty": "Thời gian khởi chiếu của phim không được để trống",
            "any.required": "Vui lòng nhập thời gian khởi chiếu của phim",
            "number.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
        }),
        endDate: Joi.string().required().custom((value, helpers) => {
            // Chuyển đổi dd/mm/yyyy sang timestamp
            const realeaseDate = convertDateToTimestamp(req.body.releaseDate);
            // Chuyển đổi lại sang yyyy/mm/dd
            const newRealeaseDate = new Date(realeaseDate);
            // Thời điểm 2 tháng kể từ ngày công chiếu
            const futureDate = new Date(newRealeaseDate.setMonth(newRealeaseDate.getMonth() + 2));
            // Chuyển đổi futureDate thành dd/mm/yyyy để thông báo;
            const date = new Date(futureDate);
            const dateString = date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

            // Chuyển đổi dd/mm/yyyy sang timestamp
            const endDate = convertDateToTimestamp(req.body.endDate);
            // Chuyển đổi lại sang yyyy/mm/dd
            const newEndDate = new Date(endDate);

            // console.log(futureDate);
            // console.log(newEndDate);
            if (newEndDate < new Date(realeaseDate)) {
                return helpers.message(`Thời gian kết thúc phải sau thời gian công chiếu`);
            }
            if (newEndDate > futureDate) {
                return helpers.message(`Thời gian kết thúc khởi chiếu phải nằm trong khoảng từ ${req.body.releaseDate} đến ${dateString}`);
            }
            return value;
        }).messages({
            "string.empty": "Thời gian kết thúc của phim không được để trống",
            "any.required": "Vui lòng nhập thời gian kết thúc của phim",
            "string.trim": "Không được để khoảng trắng ở đầu hoặc cuối",
        }),
        ageRating: Joi.string().required().valid("P", "T13", "T16", "T18"),
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

export const movieValidation = {
    createMovie
}
