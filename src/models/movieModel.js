import { GET_DB } from "../config/mongodb";
import Joi from "joi";
import { ObjectId } from "mongodb";
import { convertDateToTimestamp } from "../utils/convertDate";

const MOVIE_COLLECTION_NAME = "movies";
const MOVIE_COLLECTION_SCHEMA = Joi.object({
    title: Joi.string().required().min(5).max(100).trim().strict(),
    description: Joi.string().required().min(100).max(1000).trim().strict(),
    trailer: Joi.string().required().trim().strict(),
    poster: Joi.string().required(),
    filePoster: Joi.string().required(),
    directors: Joi.string().required(),
    actors: Joi.string().trim().allow('').optional(),
    genres: Joi.string().required().trim().strict(),
    language: Joi.string().required().valid("Tiếng Việt","Tiếng Anh","Tiếng Trung"),
    duration: Joi.number().integer().required(),
    rating: Joi.number().required(),
    releaseDate: Joi.date().timestamp("javascript"),
    endDate: Joi.date().timestamp("javascript").default(Date.now),
    ageRating: Joi.string().required().valid("P", "T13", "T16", "T18"),
    slug: Joi.string().required().trim().strict(),
    status: Joi.string().valid("active", "inactive").default("inactive"),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const getAll = async (req, res, next) => {
    try {
        const today = Date.now();
        const movies = await GET_DB().collection(MOVIE_COLLECTION_NAME).find({
            _deletedAt: false,
            endDate: { $gte: today },
        }).toArray();
        return movies;
    } catch (error) {
        throw new Error(error);
    }
}

const validateBeforeCreate = async (data) => {
    return await MOVIE_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false
    });
}

const create = async (data) => {
    try {
        var validData = await validateBeforeCreate(data);
        //Sang đây từ releaseDate và endDate lại bị chuyển đổi sang YYYY-MM-DDTHH:mm:ss.sssZ

        // Chuyển đổi releaseDate sang timestamp Unix (mili giây)
        var releaseDateObject = new Date(validData.releaseDate);
        validData.releaseDate = releaseDateObject.getTime();
        // Chuyển đổi endDate sang timestamp Unix (mili giây)
        var endDateObject = new Date(validData.endDate);
        validData.endDate = endDateObject.getTime();
        const movie = await GET_DB().collection(MOVIE_COLLECTION_NAME).insertOne(validData);
        return movie;
    } catch (error) {
        throw new Error(error);
    }
}

const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(MOVIE_COLLECTION_NAME)
            .findOne({
                _id: new ObjectId(id),
            });
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const findOne = async (filter) => {
    try {
        const result = await GET_DB()
            .collection(MOVIE_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const checkUnique = async (id, title) => {
    try {
        const result = await GET_DB()
            .collection(MOVIE_COLLECTION_NAME)
            .findOne({
                title: title,
                _id: { $ne: new ObjectId(id) },
            });
        return result;
    } catch (error) {
        throw new Error(error);
    }
}

const update = async (id, data) => {
    try {
        // Cập nhật bản ghi
        const province = await GET_DB()
            .collection(MOVIE_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return province;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const movie = await GET_DB()
            .collection(MOVIE_COLLECTION_NAME)
            .updateOne({ slug: slug }, { $set: { _deletedAt: true } });
        return movie;
    } catch (error) {
        throw new Error(error);
    }
};

const getAllByDate = async (date) => {
    try {
        const today = Date.now(); // lấy timestamp hiện tại
        let query = { _deletedAt: false };

        if (date === 'showing') {
            query = {
                ...query,
                releaseDate: { $lte: today },
                endDate: { $gte: today },
                status: 'active',
            };
        } else if (date === 'upcoming') {
            query = {
                ...query,
                releaseDate: { $gt: today },
                status: 'active',
            };
        }

        const movies = await GET_DB().collection(MOVIE_COLLECTION_NAME).find(query).toArray();
        return movies;
    } catch (error) {
        throw new Error(error);
    }
};

export const movieModel = {
    getAll,
    create,
    findOneById,
    findOne,
    checkUnique,
    update,
    getDelete,
    getAllByDate
}