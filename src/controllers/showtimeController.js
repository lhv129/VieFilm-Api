import { showtimeService } from "../services/showtimeService";

const getAll = async (req, res, next) => {
    try {
        const showtimes = await showtimeService.getAll(req.body);
        res.status(200).json({
            status: "success",
            message: "Tìm danh sách suất chiếu thành công",
            data: showtimes,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        // Điều hướng sang service
        const showtime = await showtimeService.create(req.body);
        // Có kết quả thì trả về phía Client
        res.status(201).json({
            status: "success",
            message: "Thêm mới suất chiếu thành công",
            data: showtime,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const showtime = await showtimeService.getDetails(req.params.id);
        res.status(200).json({
            status: "success",
            message: "Tìm suất chiếu thành công",
            data: showtime,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const showtime = await showtimeService.update(req.params.id, req.body);
        res.status(200).json({
            status: "success",
            message: "Cập nhật suất chiếu thành công",
            data: showtime,
        });
    } catch (error) {
        next(error);
    }
};

const getDelete = async (req, res, next) => {
    try {
        const showtime = await showtimeService.getDelete(req.body);
        res.status(200).json({
            status: "success",
            message: "Xóa suất chiếu thành công",
            data: showtime,
        });
    } catch (error) {
        next(error);
    }
};

const getSeatsByShowtime = async (req, res, next) => {
    try {
        const seats = await showtimeService.getSeatsByShowtime(req.body.showtimeId);
        res.status(200).json({
            status: "success",
            message: "Tìm danh sách ghế của suất chiếu đó thành công",
            data: seats,
        });
    } catch (error) {
        next(error);
    }
}

const getAllByMovie = async (req, res, next) => {
    try {
        const showtimes = await showtimeService.getAllByMovie(req.body);
        res.status(200).json({
            status: "success",
            message: "Tìm danh sách suất chiếu thành công",
            data: showtimes,
        });
    } catch (error) {
        next(error);
    }
}

const getAllShowtimeByCinemaHandler = async (req, res, next) => {
    try {
        const showtimes = await showtimeService.getAllShowtimeByCinemaGroupedByMovie(req.body);
        res.status(200).json({
            status: "success",
            message: "Lấy danh sách suất chiếu theo ngày và rạp thành công",
            data: showtimes,
        });
    } catch (err) {
        next(err);
    }
};

const getAllByScreen = async (req, res, next) => {
    try {
        const showtimes = await showtimeService.getAllByScreen(req.body);
        res.status(200).json({
            status: "success",
            message: "Lấy danh sách suất chiếu theo ngày và phòng chiếu thành công",
            data: showtimes,
        });
    } catch (err) {
        next(err);
    }
};

export const showtimeController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getSeatsByShowtime,
    getAllByMovie,
    getAllShowtimeByCinemaHandler,
    getAllByScreen
};
