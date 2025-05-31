import { movieModel } from "../models/movieModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { uploadImage, deleteImage } from "../config/cloudinary";
import { convertDateToTimestamp } from "../utils/convertDate";
import { slugify } from "../utils/formatters";
import { ObjectId } from "mongodb";

const getAll = async (req, res, next) => {
    try {
        const movies = await movieModel.getAll();
        return movies;
    } catch (error) {
        throw error;
    }
}

const create = async (reqBody, reqImage) => {
    try {
        const slug = slugify(reqBody.title);

        const existingTitle = await movieModel.findOne({ slug: slug });
        if (existingTitle) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Phim đã có trong hệ thống, vui lòng kiểm tra lại");
        }
        let imageUrl = "";
        let fileImage = "";
        if (reqImage) {
            const uploadResult = await uploadImage(reqImage, "movies");
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }

        //Xử lý luôn slug
        //Chuyển đổi releaseDate và endDate sang timestamp Unix (mili giây) 
        const data = {
            ...reqBody,
            poster: imageUrl,
            filePoster: fileImage,
            releaseDate: convertDateToTimestamp(reqBody.releaseDate),
            endDate: convertDateToTimestamp(reqBody.endDate),
            slug: slug,
        };
        const movie = await movieModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getMovie = await movieModel.findOneById(
            movie.insertedId.toString()
        );
        return getMovie;
    } catch (error) {
        throw error;
    }
}

const getDetails = async (slug) => {
    try {
        const today = getStartOfDay(Date.now());
        const movie = await movieModel.findOne({ slug: slug, endDate: { $gte: today } });
        return movie;
    } catch (error) {
        throw error;
    }
}

const update = async (slug, data, reqImage) => {
    try {
        const today = getStartOfDay(Date.now());
        const movie = await movieModel.findOne({ slug: slug, endDate: { $gte: today } });

        if (!movie) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Phim không tồn tại");
        }
        const checkExistingTitle = await movieModel.checkUnique(movie._id, data.title);
        if (checkExistingTitle) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên phim đã có, vui lòng nhập tên khác");
        }

        let imageUrl = "";
        let fileImage = "";
        if (reqImage) {
            await deleteImage("movies", movie.filePoster);
            const uploadResult = await uploadImage(reqImage, "movies");
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        } else {
            imageUrl = movie.poster;
            fileImage = movie.filePoster;
        }
        //Kiểm tra, phim đã xuất bản rồi thì không chỉnh sửa được ngày công chiếu 
        if (movie.status === 'active') {
            var releaseDate = movie.releaseDate;
            var endDate = movie.endDate;
        } else {
            var releaseDate = convertDateToTimestamp(data.releaseDate);
            var endDate = convertDateToTimestamp(data.endDate);
        }

        const newMovie = {
            ...data,
            poster: imageUrl,
            filePoster: fileImage,
            releaseDate: releaseDate,
            endDate: endDate,
            slug: slugify(data.title),
            updatedAt: Date.now(),
        }

        await movieModel.update(movie._id, newMovie);

        const getNewMovie = await movieModel.findOneById(movie._id);

        return getNewMovie;
    } catch (error) {
        throw error;
    }
}

const getDelete = async (slug) => {
    try {
        const movie = await movieModel.getDelete(slug);
        if (movie.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phim không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

const updateStatus = async (reqBody) => {
    try {
        const { movieId, status } = reqBody;
        const today = getStartOfDay(Date.now());
        const movie = await movieModel.findOne({ _id: new ObjectId(movieId), endDate: { $gte: today }, });
        if (!movie) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Phim không tồn tại");
        }
        if (status === 'active' || status === 'inactive') {
            const newMovie = {
                ...movie,
                status: status,
                updatedAt: Date.now()
            }
            await movieModel.update(movie._id, newMovie);

            const getMovie = await movieModel.findOneById(movie._id);

            return getMovie;
        } else {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Trạng thái của phim phải là active hoặc inactive");
        }

    } catch (error) {
        throw error;
    }
}

const getAllByDate = async (date) => {
    try {
        const movies = await movieModel.getAllByDate(date);
        return movies;
    } catch (error) {
        throw error;
    }
}

const getOneById = async (id) => {
    try {
        const movies = await movieModel.findOneById(id);
        return movies;
    } catch (error) {
        throw error;
    }
}

const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

export const movieService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    updateStatus,
    getAllByDate,
    getOneById
}