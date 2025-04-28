import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";
import { screenModel } from "./screenModel";
import { seatModel } from "./seatModel";
import { ticketModel } from "./ticketModel";
import { ticketDetailModel } from "./ticketDetailModel";

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
    date: Joi.date().required(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});


const getAll = async (date) => {
    try {
        const shotimes = await GET_DB().collection(SHOWTIME_COLLECTION_NAME).find({ _deletedAt: false }).toArray();

        let dateFilter = "";
        let filteredResults = [];

        if (!date) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng trong JavaScript bắt đầu từ 0
            const day = String(today.getDate()).padStart(2, '0');

            dateFilter = `${day}/${month}/${year}`;

            // Lọc các suất chiếu có date lớn hơn hoặc bằng ngày hiện tại
            filteredResults = shotimes.filter(showtime => {
                return showtime.date >= dateFilter;
            });
        } else {
            dateFilter = date;
            // Lọc các suất chiếu có date lớn hơn hoặc bằng ngày hiện tại
            filteredResults = shotimes.filter(showtime => {
                return showtime.date === dateFilter;
            });
        }
        return filteredResults;
    } catch (error) {
        throw new Error(error);
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
    // ep kieu cho date tu string sang ISODate
    if (typeof data.date === 'string') {
        const [day, month, year] = data.date.split('/').map(Number);
        data.date = new Date(year, month - 1, day); // tạo đối tượng Date
    }
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
                        localField: "screenId",
                        foreignField: "screenId",
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
                                    status: { $in: ["used", "pending", "paid"] },
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
                                        isBooked: {
                                            $in: ["$$seat._id", "$bookedSeats.seatId"],
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