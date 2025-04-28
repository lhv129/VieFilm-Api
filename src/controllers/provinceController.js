import { provinceService } from "../services/provinceService";


const getAll = async (req, res, next) => {
    try {
        const provinces = await provinceService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách tỉnh thành, thành công",
            data: provinces
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const province = await provinceService.create(req.body);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới thành công tỉnh thành",
            data: province
        });
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const province = await provinceService.getDetails(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Tìm thành công tỉnh thành",
            data: province
        });
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const province = await provinceService.update(req.params.slug, req.body);
        res.status(200).json({
            status: "success",
            message: "Cập nhật tỉnh thành, thành công",
            data: province,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const province = await provinceService.getDelete(req.params.slug);
        res.status(200).json({
            status: "success",
            message: "Xóa tỉnh thành, thành công",
            data: province,
        });
    } catch (error) {
        next(error);
    }
};

const getCinemaByProvince = async (req, res, next) => {
    try {
        const provinces = await provinceService.getCinemaByProvince();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách tỉnh thành, thành công",
            data: provinces
        });
    } catch (error) {
        next(error);
    }
}

export const provinceController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getCinemaByProvince
}