import { cinemaService } from "../services/cinemaService";


const getAll = async (req, res, next) => {
    try {
        const cinemas = await cinemaService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách rạp phim thành công",
            data: cinemas
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const cinema = await cinemaService.create(req.body, req.file);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới thành công rạp phim",
            data: cinema
        });
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const cinema = await cinemaService.getDetails(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Tìm thành công rạp phim",
            data: cinema
        });
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const cinema = await cinemaService.update(req.params.slug, req.body, req.file);
        res.status(200).json({
            status: "success",
            message: "Cập nhật rạp phim thành công",
            data: cinema,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const cinema = await cinemaService.getDelete(req.params.slug);
        res.status(200).json({
            status: "success",
            message: "Xóa rạp phim thành công",
            data: cinema,
        });
    } catch (error) {
        next(error);
    }
};

const getAllByProvince = async (req, res, next) => {
    try {
        const cinemas = await cinemaService.getAllByProvince(req.body.provinceId);
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách rạp phim thành công",
            data: cinemas
        });
    } catch (error) {
        next(error);
    }
}

const getOneById = async (req, res, next) => {
    try {
        const cinema = await cinemaService.getOneById(req.params.id);
        return res.status(200).json({
            status: "success",
            message: "Tìm thành công rạp phim",
            data: cinema
        });
    } catch (error) {
        next(error)
    }
}

export const cinemaController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getAllByProvince,
    getOneById
}