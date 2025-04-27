import { productService } from "../services/productService";


const getAll = async (req, res, next) => {
    try {
        const product = await productService.getAll();
        return res.status(200).json({
            status: "success",
            message: "Lấy danh sách combo thành công",
            data: product
        });
    } catch (error) {
        next(error);
    }
}

const create = async (req, res, next) => {
    try {
        const product = await productService.create(req.body, req.file);
        return res.status(201).json({
            status: "success",
            message: "Thêm mới combo thành công",
            data: product
        });
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const product = await productService.getDetails(req.params.slug);
        return res.status(200).json({
            status: "success",
            message: "Tìm combo, sản phẩm thành công",
            data: product
        });
    } catch (error) {
        next(error)
    }
}

const update = async (req, res, next) => {
    try {
        const product = await productService.update(req.params.slug, req.body, req.file);
        res.status(200).json({
            status: "success",
            message: "Cập nhật thành công",
            data: product,
        });
    } catch (error) {
        next(error);
    }
}

const getDelete = async (req, res, next) => {
    try {
        const product = await productService.getDelete(req.params.slug);
        res.status(200).json({
            status: "success",
            message: "Xóa combo thành công",
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

export const productController = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
}