import { slugify } from "../utils/formatters";
import { provinceModel } from "../models/provinceModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getAll = async () => {
    try {
        const provinces = await provinceModel.getAll();
        return provinces;
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
        const existingProvince = await provinceModel.findOne({ name: data.name });
        if (existingProvince) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên tỉnh thành đã có, vui lòng chọn tên khác");
        }

        // Nếu chưa tồn tại thì thêm mới
        const province = await provinceModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getProvince = await provinceModel.findOneById(
            province.insertedId.toString()
        );

        return getProvince;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (slug) => {
    try {
        const province = await provinceModel.findOne({ slug: slug });
        if (!province) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }
        return province;
    } catch (error) {
        throw error;
    }
};

const update = async (slug, data) => {
    try {
        const province = await provinceModel.findOne({ slug: slug });
        if (!province) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }
        // Nếu có tồn tại thì cập nhật
        let newProvince = {
            ...data,
            slug: slugify(data.name),
            updatedAt: Date.now()
        };

        // Cập nhật
        newProvince = await provinceModel.update(province._id, newProvince);

        //Lấy bản ghi sau khi cập nhật
        const getNewProvince = await provinceModel.findOneById(province._id.toString());

        return getNewProvince;

    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const province = await provinceModel.getDelete(slug);
        if (province.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

const getCinemaByProvince = async () => {
    try {
        const provinces = await provinceModel.getCinemaByProvince();
        return provinces;
    } catch (error) {
        throw error;
    }
}

export const provinceService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getCinemaByProvince
};
