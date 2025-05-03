import Joi from "joi";
import moment from "moment";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const createShowtime = async (req, res, next) => {
    const correctCondition = Joi.object({
        cinemaId: Joi.string().required(),
        movieId: Joi.string().required(),
        screenId: Joi.string().required(),
        startTime: Joi.string().required(),
        date: Joi.string().required(),
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

const validateDateAndStartTime = (date, startTime, movie) => {
    const now = moment(); // Thời điểm hiện tại
    const inputDate = moment(date, 'DD/MM/YYYY'); // Parse ngày nhập
    const movieReleaseDate = moment(movie.releaseDate); // Parse releaseDate từ timestamp
    const movieEndDate = moment(movie.endDate); // Parse endDate từ timestamp

    // Check nếu date trong quá khứ (trước hôm nay)
    if (inputDate.isBefore(now, 'day')) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Không thể thêm suất chiếu vào ngày trong quá khứ");
    }

    // Check nếu date trước ngày công chiếu phim
    if (inputDate.isBefore(movieReleaseDate, 'day')) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Không thể thêm suất chiếu trước ngày công chiếu của phim");
    }

    // Check nếu date sau ngày kết thúc phim
    if (inputDate.isAfter(movieEndDate, 'day')) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Ngày chiếu vượt quá thời gian kết thúc của phim");
    }

    // Nếu date là hôm nay → kiểm tra thêm startTime
    if (inputDate.isSame(now, 'day')) {
        const inputStartTime = moment(`${date} ${startTime}`, 'DD/MM/YYYY HH:mm');

        if (inputStartTime.isBefore(now)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Không thể thêm suất chiếu với thời gian trong quá khứ");
        }
    }
};

export const showtimeValidation = {
    createShowtime,
    validateDateAndStartTime
}
