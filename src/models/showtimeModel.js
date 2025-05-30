import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";
import { screenModel } from "./screenModel";
import { seatModel } from "./seatModel";
import { ticketModel } from "./ticketModel";
import { ticketDetailModel } from "./ticketDetailModel";
import { movieModel } from "./movieModel";

const SHOWTIME_COLLECTION_NAME = "showtimes";
const SHOWTIME_COLLECTION_SCHEMA = Joi.object({
    movieId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    screenId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    date: Joi.string().required(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});


const getAll = async (data) => {
    try {
        const db = GET_DB();

        const pipeline = [
            { $match: { _deletedAt: false } },

            {
                $lookup: {
                    from: 'movies', // đảm bảo đây đúng tên collection
                    localField: 'movieId',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            {
                $lookup: {
                    from: 'screens',
                    localField: 'screenId',
                    foreignField: '_id',
                    as: 'screen'
                }
            },
            { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$screen', preserveNullAndEmptyArrays: true } },

            // Kiểm tra nếu có 'date' trong data
            ...(data.date
                ? [{ $match: { date: data.date } }]
                : [
                    {
                        $addFields: {
                            parsedDate: {
                                $dateFromString: {
                                    dateString: '$date',
                                    format: '%d/%m/%Y'
                                }
                            }
                        }
                    },
                    {
                        $match: {
                            parsedDate: { $gte: new Date() }
                        }
                    }
                ]),

            // Kiểm tra nếu có 'cinemaId' trong data
            ...(data.cinemaId
                ? [{ $match: { 'screen.cinemaId': new ObjectId(data.cinemaId) } }]
                : []),

            // Kiểm tra nếu có 'movieId' trong data
            ...(data.movieId
                ? [{ $match: { 'movie._id': new ObjectId(data.movieId) } }]
                : []),

            // Kiểm tra nếu có 'screenId' trong data
            ...(data.screenId
                ? [{ $match: { 'screen._id': new ObjectId(data.screenId) } }]
                : []),

            {
                $project: {
                    _id: 1,
                    screenId: 1,
                    movieId: 1,
                    startTime: 1,
                    date: 1,
                    endTime: 1,
                    createdAt: 1,
                    movieTitle: '$movie.title',
                    screenName: '$screen.name'
                }
            }
        ];

        const showtimes = await db
            .collection(SHOWTIME_COLLECTION_NAME)
            .aggregate(pipeline)
            .toArray();

        return showtimes;
    } catch (error) {
        throw new Error(error.message);
    }
};





const findOneById = async (id) => {
    try {
        const result = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
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
            .collection(SHOWTIME_COLLECTION_NAME)
            .findOne(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

const validateBeforeCreate = async (data) => {
    delete data.cinemaId;
    return await SHOWTIME_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const create = async (data) => {
    try {
        const validData = await validateBeforeCreate(data);
        // Ép kiểu screenId thành objectID
        if (typeof validData.screenId === "string") {
            validData.screenId = new ObjectId(validData.screenId);
        }
        // Ép kiểu movieId thành objectID
        if (typeof validData.movieId === "string") {
            validData.movieId = new ObjectId(validData.movieId);
        }
        const showtime = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
            .insertOne(validData);
        return showtime;
    } catch (error) {
        throw new Error(error);
    }
};

const update = async (id, data) => {
    try {
        delete data.cinemaId;
        // Cập nhật bản ghi
        const showtime = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: data });

        return showtime;
    } catch (error) {
        throw error;
    }
}

const getDelete = async (id) => {
    try {
        const showtime = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
            .updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: true } });
        return showtime;
    } catch (error) {
        throw new Error(error);
    }
};

const getSeatsByShowtime = async (showtimeId) => {
    try {
        const result = await GET_DB()
            .collection(SHOWTIME_COLLECTION_NAME)
            .aggregate([
                {
                    $match: {
                        _id: new ObjectId(showtimeId),
                        _deletedAt: false,
                    },
                },
                {
                    $lookup: {
                        from: screenModel.SCREEN_COLLECTION_NAME,
                        localField: "screenId",
                        foreignField: "_id",
                        as: "screenInfo",
                    },
                },
                {
                    $unwind: "$screenInfo",
                },
                {
                    $lookup: {
                        from: seatModel.SEAT_COLLECTION_NAME,
                        let: { screenId: "$screenId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$screenId", "$$screenId"] },
                                    _deletedAt: false,
                                },
                            },
                        ],
                        as: "seats",
                    },
                },
                {
                    $lookup: {
                        from: ticketModel.TICKET_COLLECTION_NAME,
                        let: { showtimeId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$showtimeId", "$$showtimeId"] },
                                    _deletedAt: false,
                                    status: { $in: ["used", "pending", "paid", "hold"] },
                                },
                            },
                            {
                                $lookup: {
                                    from: ticketDetailModel.TICKET_DETAIL_COLLECTION_NAME,
                                    localField: "_id",
                                    foreignField: "ticketId",
                                    as: "ticketDetails",
                                },
                            },
                            {
                                $unwind: "$ticketDetails",
                            },
                            {
                                $project: {
                                    seatId: "$ticketDetails.seatId",
                                    ticketStatus: "$status",
                                    userId: "$userId",
                                    _id: 0,
                                },
                            },
                        ],
                        as: "bookedSeats",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        screenId: 1,
                        movieId: 1,
                        startTime: 1,
                        endTime: 1,
                        date: 1,
                        screen: {
                            _id: "$screenInfo._id",
                            name: "$screenInfo.name",
                            seats: {
                                $map: {
                                    input: "$seats",
                                    as: "seat",
                                    in: {
                                        _id: "$$seat._id",
                                        row: "$$seat.row",
                                        number: "$$seat.number",
                                        type: "$$seat.type",
                                        seatCode: "$$seat.seatCode",
                                        status: "$$seat.status",
                                        price: "$$seat.price",
                                        isBooked: {
                                            $let: {
                                                vars: {
                                                    matchedBooking: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: "$bookedSeats",
                                                                    as: "b",
                                                                    cond: { $eq: ["$$b.seatId", "$$seat._id"] },
                                                                },
                                                            },
                                                            0,
                                                        ],
                                                    },
                                                },
                                                in: {
                                                    $ifNull: ["$$matchedBooking.ticketStatus", false],
                                                },
                                            },
                                        },
                                        bookedBy: {
                                            $let: {
                                                vars: {
                                                    matchedBooking: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: "$bookedSeats",
                                                                    as: "b",
                                                                    cond: { $eq: ["$$b.seatId", "$$seat._id"] },
                                                                },
                                                            },
                                                            0,
                                                        ],
                                                    },
                                                },
                                                in: {
                                                    $cond: {
                                                        if: {
                                                            $in: ["$$matchedBooking.ticketStatus", ["hold", "paid", "pending", "used"]],
                                                        },
                                                        then: "$$matchedBooking.userId",
                                                        else: null,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ])
            .toArray();

        return result[0] || {};
    } catch (error) {
        throw new Error(error);
    }
};


export const showtimeModel = {
    getAll,
    findOneById,
    findOne,
    find,
    create,
    update,
    getDelete,
    getSeatsByShowtime,
}