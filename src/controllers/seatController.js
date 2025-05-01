import { seatService } from "../services/seatService";


const getAll = async (req, res, next) => {
    try {
        const seats = await seatService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách ghế thành công",
            data: seats
        })
    } catch (error) {
        next(error);
    }
}

const createSeats = async (req, res, next) => {
    try {
        const seats = await seatService.createSeats(req.body);
        return res.status(201).json({
            status: "success",
            message: "Thêm ghế thành công",
            data: seats
        })
    } catch (error) {
        next(error);
    }
}

const getDetails = async (req, res, next) => {
    try {
        const seat = await seatService.getDetails(req.params.id);
        return res.status(201).json({
            status: "success",
            message: "Tìm ghế thành công",
            data: seat
        })
    } catch (error) {
        next(error);
    }
}

const getAllByScreen = async (req, res, next) => {
    try {
        const seats = await seatService.getAllByScreen(req.body.screenId);
        return res.status(200).json({
            status: "success",
            message: "Tìm ghế thành công",
            data: seats
        })
    } catch (error) {
        next(error);
    }
}

const update = async (req, res, next) => {
    try {
        const seat = await seatService.update(req.body);
        res.status(200).json({
            status: "success",
            message: "Cập nhật ghế thành công",
            data: seat,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const seat = await seatService.getDelete(req.body);
        res.status(200).json({
            status: "success",
            message: "Xóa ghế thành công",
            data: [],
        });
    } catch (error) {
        next(error)
    }
}

export const seatController = {
    getAll,
    createSeats,
    getDetails,
    getAllByScreen,
    update,
    getDelete,
}