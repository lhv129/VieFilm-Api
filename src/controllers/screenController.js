import { screenService } from "../services/screenService";


const getAll = async (req, res, next) => {
    try {
        const screens = await screenService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách phòng chiếu thành công",
            data: screens
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const screen = await screenService.create(req.body);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới thành công phòng chiếu",
            data: screen
        });
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const screen = await screenService.getDetails(req.params.id);
        return res.status(200).json({
            status: "success",
            message: "Tìm thành công phòng chiếu",
            data: screen
        });
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const screen = await screenService.update(req.body);
        res.status(200).json({
            status: "success",
            message: "Cập nhật phòng chiếu thành công",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const screen = await screenService.getDelete(req.body);
        res.status(200).json({
            status: "success",
            message: "Xóa phòng chiếu thành công",
            data: screen,
        });
    } catch (error) {
        next(error);
    }
};

const getAllByCinema = async (req, res, next) => {
    try {
        const cinemas = await screenService.getAllByCinema(req.body.cinemaId);
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách phòng chiếu thành công",
            data: cinemas
        });
    } catch (error) {
        next(error);
    }
}

const getOne = async (req, res, next) => {
    try {
        const screen = await screenService.getOne(req.body);
        return res.status(200).json({
            status: "success",
            message: "Tìm thành công phòng chiếu",
            data: screen
        });
    } catch (error) {
        next(error)
    }
}

export const screenController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getAllByCinema,
    getOne
}