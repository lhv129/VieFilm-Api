import { slugify } from "../utils/formatters";
import { paymentMethodModel } from "../models/paymentMethodModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getAll = async () => {
    try {
        const paymentMethods = await paymentMethodModel.getAll();
        return paymentMethods;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody) => {
    try {
        //Xử lý luôn slug
        const data = {
            ...reqBody,
            slug: slugify(reqBody.name),
        };
        // Kiểm tra xem name đã tồn tại chưa
        const existingPaymentMethod = await paymentMethodModel.findOne({ name: data.name });
        if (existingPaymentMethod) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Phương thức thanh toán đã có");
        }

        // Nếu chưa tồn tại thì thêm mới
        const paymentMethod = await paymentMethodModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getPaymentMethod = await paymentMethodModel.findOneById(
            paymentMethod.insertedId.toString()
        );

        return getPaymentMethod;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (slug) => {
    try {
        const paymentMethod = await paymentMethodModel.findOne({ slug: slug });
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }
        return paymentMethod;
    } catch (error) {
        throw error;
    }
};

const update = async (slug, data) => {
    try {
        const paymentMethod = await paymentMethodModel.findOne({ slug: slug });
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phương thức thanh toán không tồn tại");
        }
        // Nếu có tồn tại thì cập nhật
        let newPaymentMethod = {
            ...data,
            slug: slugify(data.name),
            updatedAt: Date.now()
        };

        // Cập nhật
        newPaymentMethod = await paymentMethodModel.update(paymentMethod._id, newPaymentMethod);

        //Lấy bản ghi sau khi cập nhật
        const getNewPaymentMethod = await paymentMethodModel.findOneById(paymentMethod._id.toString());

        return getNewPaymentMethod;

    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const paymentMethod = await paymentMethodModel.getDelete(slug);
        if (paymentMethod.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

export const paymentMethodService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
};
