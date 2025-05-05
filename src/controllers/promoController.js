// promoController.js
import { promoService } from "../services/promoService";

const getAll = async (req, res, next) => {
    try {
        const promos = await promoService.getAll();
        res.status(200).json({ status: "success", message: "Lấy danh sách mã giảm giá thành công", data: promos });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const created = await promoService.create(req.body);
        res.status(201).json({ status: "success", message: "Tạo mã giảm giá thành công", data: created });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const promoId = req.params.id;
        const promo = await promoService.getDetails(promoId);
        res.status(200).json({ status: "success", message: "Lấy chi tiết mã giảm giá thành công", data: promo });
    } catch (error) {
        next(error);
    }
};

const updatePromo = async (req, res, next) => {
    try {
        const promoId = req.params.id;
        const updated = await promoService.updatePromo(promoId, req.body);
        res.status(200).json({ status: "success", message: "Cập nhật mã giảm giá thành công", data: updated });
    } catch (error) {
        next(error);
    }
};

const deletePromo = async (req, res, next) => {
    try {
        const promoId = req.params.id;
        await promoService.deletePromo(promoId);
        res.status(200).json({ status: "success", message: "Xóa mã giảm giá thành công", data: [] });
    } catch (error) {
        next(error);
    }
};

export const promoController = {
    getAll,
    create,
    getDetails,
    updatePromo,
    deletePromo,
};
