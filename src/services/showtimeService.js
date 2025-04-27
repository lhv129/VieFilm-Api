import { movieModel } from "../models/movieModel";
import { screenModel } from "../models/screenModel";
import { showtimeModel } from "../models/showtimeModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { autoCalculateEndDate } from "../utils/autoCalculateEndDate";
import moment from "moment";
import { ObjectId } from "mongodb";

const getAll = async (date) => {
    try {
        const showtimes = await showtimeModel.getAll(date);
        return showtimes;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody) => {
    try {
        const { screenId, movieId, date, startTime } = reqBody;

        const movie = await movieModel.findOneById(movieId);
        if (!movie) {
            throw new ApiError(StatusCodes.NOT_FOUND, "MovieId không tồn tại, vui lòng kiểm tra lại");
        }
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "ScreenId không tồn tại, vui lòng kiểm tra lại");
        }
        const endTime = await autoCalculateEndDate.calculateEndTime(startTime, date, movie.duration);
        // Lấy ra toàn bộ danh sách showtime của phòng muốn thêm trong ngày hôm đó
        const existingShowtimes = await showtimeModel.find({ screenId: new ObjectId(screenId), date: date, _deletedAt: false })

        // Kiểm tra xem có suất chiếu nào bị trùng lịch không
        for (const existingShowtime of existingShowtimes) {
            // Chuyển đổi thời gian sang đối tượng Moment để so sánh
            const newStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
            const newEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

            // Tạo khoảng thời gian có buffer 15 phút cho suất chiếu mới và hiện có
            const newStartTimeWithBuffer = newStartTime.clone().subtract(15, 'minutes');
            const newEndTimeWithBuffer = newEndTime.clone().add(15, 'minutes');

            const existingStartTime = moment(`${existingShowtime.date} ${existingShowtime.startTime}`, 'YYYY-MM-DD HH:mm');
            const existingEndTime = moment(`${existingShowtime.date} ${existingShowtime.endTime}`, 'YYYY-MM-DD HH:mm');

            // Kiểm tra các trường hợp trùng lịch
            if (newStartTimeWithBuffer.isBefore(existingEndTime) && newEndTimeWithBuffer.isAfter(existingStartTime)) {
                // Format the conflicting showtime's details for the error message
                const existingShowtimeStartTimeFormatted = moment(existingStartTime).format('HH:mm');
                const existingShowtimeEndTimeFormatted = moment(existingEndTime).format('HH:mm');

                throw new ApiError(StatusCodes.CONFLICT, `Khung giờ chiếu bị trùng với suất chiếu từ ${existingShowtimeStartTimeFormatted} đến ${existingShowtimeEndTimeFormatted}`);
            }
        }

        const data = {
            ...reqBody,
            endTime: endTime,
        };
        const showtime = await showtimeModel.create(data);
        const getShowtime = await showtimeModel.findOneById(showtime.insertedId.toString());
        return getShowtime;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (id) => {
    try {
        const showtime = await showtimeModel.findOneById(id);
        return showtime;
    } catch (error) {
        throw error;
    }
}

const update = async (id, reqBody) => {
    try {
        const showtime = await showtimeModel.findOneById(id);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }

        const { screenId, movieId, date, startTime } = reqBody;
        const movie = await movieModel.findOneById(movieId);
        if (!movie) {
            throw new ApiError(StatusCodes.NOT_FOUND, "MovieId không tồn tại, vui lòng kiểm tra lại");
        }
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "ScreenId không tồn tại, vui lòng kiểm tra lại");
        }
        const endTime = await autoCalculateEndDate.calculateEndTime(startTime, date, movie.duration);
        // Lấy ra toàn bộ danh sách showtime của phòng muốn thêm trong ngày hôm đó
        const existingShowtimes = await showtimeModel.find({ screenId: new ObjectId(screenId), date: date, _deletedAt: false })

        // Loại bỏ suất chiếu đang được chỉnh sửa ra khỏi mảng
        const updatedShowtimes = existingShowtimes.filter(existingShowtime => existingShowtime._id.toString() !== id);

        // Kiểm tra xem có suất chiếu nào bị trùng lịch không
        for (const existingShowtime of updatedShowtimes) {
            // Chuyển đổi thời gian sang đối tượng Moment để so sánh
            const newStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
            const newEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

            // Tạo khoảng thời gian có buffer 15 phút cho suất chiếu mới và hiện có
            const newStartTimeWithBuffer = newStartTime.clone().subtract(15, 'minutes');
            const newEndTimeWithBuffer = newEndTime.clone().add(15, 'minutes');

            const existingStartTime = moment(`${existingShowtime.date} ${existingShowtime.startTime}`, 'YYYY-MM-DD HH:mm');
            const existingEndTime = moment(`${existingShowtime.date} ${existingShowtime.endTime}`, 'YYYY-MM-DD HH:mm');

            // Kiểm tra các trường hợp trùng lịch
            if (newStartTimeWithBuffer.isBefore(existingEndTime) && newEndTimeWithBuffer.isAfter(existingStartTime)) {
                // Format the conflicting showtime's details for the error message
                const existingShowtimeStartTimeFormatted = moment(existingStartTime).format('HH:mm');
                const existingShowtimeEndTimeFormatted = moment(existingEndTime).format('HH:mm');

                throw new ApiError(StatusCodes.CONFLICT, `Khung giờ chiếu bị trùng với suất chiếu từ ${existingShowtimeStartTimeFormatted} đến ${existingShowtimeEndTimeFormatted}`);
            }
        }

        const data = {
            ...reqBody,
            screenId: new ObjectId(screenId),
            movieId: new ObjectId(movieId),
            endTime: endTime,
            updatedAt: Date.now()
        };
        await showtimeModel.update(id, data);
        const getShowtime = await showtimeModel.findOneById(showtime._id.toString());
        return getShowtime;
    } catch (error) {
        throw error;
    }
}

const getDelete = async (id) => {
    try {
        const showtime = await showtimeModel.findOneById(id);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }
        await showtimeModel.getDelete(id);
        return [];
    } catch (error) {
        throw error;
    }
}

const getSeatsByShowtime = async (showtimeId) => {
    try {
        const showtime = await showtimeModel.getSeatsByShowtime(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }
        return showtime;
    } catch (error) {
        throw error;
    }
}

export const showtimeService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getSeatsByShowtime
};
