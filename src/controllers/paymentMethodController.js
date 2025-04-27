import { paymentMethodService } from "../services/paymentMethodService";


const getAll = async (req, res, next) => {
    try {
        const paymentMethods = await paymentMethodService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách phương thức thanh toán thành công",
            data: paymentMethods
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const paymentMethod = await paymentMethodService.create(req.body);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới phương thức thanh toán thành công",
            data: paymentMethod
        });
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const paymentMethod = await paymentMethodService.getDetails(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Tìm phương thức thanh toán thành công",
            data: paymentMethod
        });
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const paymentMethod = await paymentMethodService.update(req.params.slug, req.body);
        res.status(200).json({
            status: "success",
            message: "Cập nhật phương thức thanh toán thành công",
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const paymentMethod = await paymentMethodService.getDelete(req.params.slug);
        res.status(200).json({
            status: "success",
            message: "Xóa phương thức thanh toán thành công",
            data: paymentMethod,
        });
    } catch (error) {
        next(error);
    }
};

export const paymentMethodController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
}