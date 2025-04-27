import { movieService } from "../services/movieService";


const getAll = async (req, res, next) => {
    try {
        const movies = await movieService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách phim thành công",
            data: movies
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const movie = await movieService.create(req.body, req.file);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới phim thành công",
            data: movie
        });
    } catch (error) {
        next(error);
    }
}

const getDetails = async (req, res, next) => {
    try {
        const movie = await movieService.getDetails(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Tìm phim thành công",
            data: movie
        });
    } catch (error) {
        next(error);
    }
}

const update = async (req, res, next) => {
    try {
        const movie = await movieService.update(req.params.slug, req.body, req.file);
        return res.status(200).json({
            status: "success",
            message: "Cập nhật phim thành công",
            data: movie
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const movie = await movieService.getDelete(req.params.slug);
        res.status(200).json({
            status: "success",
            message: "Xóa phim thành công",
            data: movie,
        });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const movie = await movieService.updateStatus(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Cập nhật trạng thái phim thành công",
            data: movie
        });
    } catch (error) {
        next(error);
    }
}

export const movieController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    updateStatus
}