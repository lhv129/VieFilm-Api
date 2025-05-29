// promoService.js
import { ObjectId } from "mongodb";
import { promoModel } from "../models/promoModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getAll = async () => {
    try {
        return await promoModel.getAll();
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody) => {
    try {
        // Tạo mã name tự động: MGG-random 5-10 số
        const randomCode = Math.floor(10000 + Math.random() * 9000000000); // đảm bảo có ít nhất 5 chữ số
        const name = `MGG-${randomCode}`;

        const newPromo = {
            ...reqBody,
            name,
        };

        // Kiểm tra trùng name
        const existing = await promoModel.findOne({ name: newPromo.name });
        if (existing) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Mã giảm giá đã tồn tại");
        }

        const created = await promoModel.create(newPromo);
        return await promoModel.findOneById(created.insertedId.toString());
    } catch (error) {
        throw error;
    }
};

const getDetails = async (promoId) => {
    try {
        const promo = await promoModel.findOneById(promoId);
        if (!promo) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
        }
        return promo;
    } catch (error) {
        throw error;
    }
};

const updatePromo = async (promoId, dataUpdate) => {
    try {
        // Không cho update name
        delete dataUpdate.name;

        // Kiểm tra logic ngày nếu có startDate và endDate
        if (dataUpdate.startDate && dataUpdate.endDate) {
            const start = new Date(dataUpdate.startDate);
            const end = new Date(dataUpdate.endDate);
            if (end <= start) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "endDate phải lớn hơn startDate");
            }
        }

        const promo = await promoModel.findOneById(promoId);
        if (!promo) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
        }

        const newData = {
            ...dataUpdate,
            updatedAt: Date.now()
        };

        await promoModel.updatePromo(promo._id, newData);
        return await promoModel.findOneById(promo._id.toString());
    } catch (error) {
        throw error;
    }
};

const deletePromo = async (promoId) => {
    try {
        const deleted = await promoModel.deletePromo(promoId);
        if (deleted.deletedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

const getOneByName = async (reqBody) => {
    try {
        const promo = await promoModel.find({ name: reqBody.name });
        if (promo.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
        }
        if (promo[0].status === 'inactive') {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá đã bị vô hiệu hóa");
        }
        const today = new Date();
        const startDate = new Date(promo[0].startDate);
        const endDate = new Date(promo[0].endDate);

        // Đặt giờ của ngày hiện tại về 00:00:00 để so sánh chính xác
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (today < startDate || today > endDate) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Mã giảm giá không còn hiệu lực");
        }
        return promo[0];
    } catch (error) {
        throw error;
    }
};

const updateStatus = async (reqBody) => {
    try {
        const { promoId, status } = reqBody;
        const promo = await promoModel.findOne({ _id: new ObjectId(promoId) });
        if (!promo) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
        }
        if (status === 'active' || status === 'inactive') {
            await promoModel.updatePromo(promoId, { status: status });
            //Lấy bản ghi sau khi cập nhật
            const getNewPromo = await promoModel.findOneById(promo._id.toString());
            return getNewPromo;
        } else {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Status của mã giảm giá phải là active hoặc inactive");
        }

    } catch (error) {
        throw error;
    }
};

export const promoService = {
    getAll,
    create,
    getDetails,
    updatePromo,
    deletePromo,
    getOneByName,
    updateStatus
};
