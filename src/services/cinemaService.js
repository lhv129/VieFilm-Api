import { slugify } from "../utils/formatters";
import { cinemaModel } from "../models/cinemaModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { uploadImage, deleteImage } from "../config/cloudinary";
import { provinceModel } from "../models/provinceModel";

const getAll = async () => {
    try {
        const cinemas = await cinemaModel.getAll();
        return cinemas;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody, reqImage) => {
    try {
        const province = await provinceModel.findOneById(reqBody.provinceId);
        if (!province) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại");
        }

        // Kiểm tra xem name đã tồn tại chưa
        const existingCinema = await cinemaModel.findOne({ name: reqBody.name });
        if (existingCinema) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên rạp phim đã có, vui lòng chọn tên khác");
        }
        //Thêm ảnh
        let imageUrl = "";
        let fileImage = "";
        if (reqImage) {
            const uploadResult = await uploadImage(reqImage, "cinemas", 500, 400);
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }

        //Xử lý luôn slug
        const data = {
            ...reqBody,
            images: imageUrl,
            fileImage: fileImage,
            slug: slugify(reqBody.name),
        };

        // Nếu chưa tồn tại thì thêm mới
        const cinema = await cinemaModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getCinema = await cinemaModel.findOneById(
            cinema.insertedId.toString()
        );

        return getCinema;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (slug) => {
    try {
        const cinema = await cinemaModel.getDetails(slug);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }
        return cinema;
    } catch (error) {
        throw error;
    }
};

const update = async (slug, data, reqImage) => {
    try {
        const cinema = await cinemaModel.findOne({ slug: slug });
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }
        // Nếu thay đổi ảnh thì cập nhật
        let imageUrl = cinema.images;
        let fileImage = cinema.fileImage;
        if (reqImage) {
            await deleteImage("cinemas", fileImage);
            const uploadResult = await uploadImage(reqImage, "cinemas", 500, 400);
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }
        // Nếu có tồn tại thì cập nhật
        let newCinema = {
            ...data,
            images: imageUrl,
            fileImage: fileImage,
            slug: slugify(data.name),
            updatedAt: Date.now()
        };

        // Cập nhật
        newCinema = await cinemaModel.update(cinema._id, newCinema);

        //Lấy bản ghi sau khi cập nhật
        const getNewCinema = await cinemaModel.findOneById(cinema._id.toString());

        return getNewCinema;

    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const cinema = await cinemaModel.getDelete(slug);
        if (cinema.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

const getAllByProvince = async (provinceId) => {
    try {
        const province = await provinceModel.findOneById(provinceId);
        if (!province) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Tỉnh thành không tồn tại")
        }

        const cinemas = await cinemaModel.getAllByProvince(provinceId);
        return cinemas;
    } catch (error) {
        throw error;
    }
}

const getOneById = async (id) => {
    try {
        const cinema = await cinemaModel.findOneById(id);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }
        return cinema;
    } catch (error) {
        throw error;
    }
};

export const cinemaService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getAllByProvince,
    getOneById
};
