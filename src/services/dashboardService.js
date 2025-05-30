import { ObjectId } from "mongodb";
import { GET_DB } from "../config/mongodb";
import { cinemaModel } from "../models/cinemaModel";
import { provinceModel } from "../models/provinceModel";
import dayjs from "dayjs";

const getRevenueByCinema = async (reqBody) => {

    const {cinemaId} = reqBody;

    if (!cinemaId) throw new Error("cinemaId is required");

    try {
        const db = GET_DB();

        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) throw new Error("Cinema not found");

        const matchQuery = {
            status: { $in: ["paid", "used"] },
            cinemaId: new ObjectId(cinemaId)
        };

        const tickets = await db.collection("tickets").aggregate([
            { $match: matchQuery },
            {
                $project: {
                    totalAmount: 1,
                    date: { $toDate: "$createdAt" }
                }
            }
        ]).toArray();

        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const monthsOfYear = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const result = {
            week: Array(7).fill(0).map((_, i) => ({ name: daysOfWeek[i], revenue: 0 })),
            month: Array(4).fill(0).map((_, i) => ({ name: `Tuần ${i + 1}`, revenue: 0 })),
            year: Array(12).fill(0).map((_, i) => ({ name: monthsOfYear[i], revenue: 0 }))
        };

        tickets.forEach(ticket => {
            const date = new Date(ticket.date);
            const day = date.getDay(); // 0 - 6
            const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 7), 3); // 0 - 3
            const month = date.getMonth(); // 0 - 11

            result.week[day].revenue += ticket.totalAmount;
            result.month[weekIndex].revenue += ticket.totalAmount;
            result.year[month].revenue += ticket.totalAmount;
        });

        const toMillion = (value) => Math.round((value / 1_000_000) * 10) / 10;

        ['week', 'month', 'year'].forEach(period => {
            result[period].forEach(item => {
                item.revenue = toMillion(item.revenue);
            });
        });

        return result;
    } catch (error) {
        throw error;
    }
};


const getRevenueByMovie = async (reqBody) => {
    try {
        const db = GET_DB();
        const { cinemaId } = reqBody;

        const results = await db.collection("tickets").aggregate([
            {
                $match: {
                    status: { $in: ["paid", "used"] }
                }
            },
            // 1. Join showtimes để lấy screenId và movieId
            {
                $lookup: {
                    from: "showtimes",
                    localField: "showtimeId",
                    foreignField: "_id",
                    as: "showtime"
                }
            },
            { $unwind: "$showtime" },

            // 2. Join screens để lấy cinemaId
            {
                $lookup: {
                    from: "screens",
                    localField: "showtime.screenId",
                    foreignField: "_id",
                    as: "screen"
                }
            },
            { $unwind: "$screen" },

            // 3. Lọc theo cinemaId
            {
                $match: {
                    "screen.cinemaId": new ObjectId(cinemaId)
                }
            },

            // 4. Group theo movieId
            {
                $group: {
                    _id: "$showtime.movieId",
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },

            // 5. Join movies để lấy tên phim
            {
                $lookup: {
                    from: "movies",
                    localField: "_id",
                    foreignField: "_id",
                    as: "movie"
                }
            },
            { $unwind: "$movie" },

            // 6. Project kết quả: tên phim + doanh thu (triệu đồng)
            {
                $project: {
                    _id: 0,
                    name: "$movie.title",
                    revenue: {
                        $round: [
                            { $divide: ["$totalRevenue", 1_000_000] },
                            1
                        ]
                    }
                }
            },
            {
                $sort: { revenue: -1 }
            },
            {
                $limit: 10
            }
        ]).toArray();

        return results;
    } catch (error) {
        throw error;
    }
};


const fillDaily = (dailyResult) => {
    const today = dayjs().startOf("day");
    const startDate = today.subtract(6, "day");

    const mapSeatType = {
        "Ghế thường": "regular",
        "Ghế VIP": "vip",
        "Ghế đôi": "couple",
    };

    const mapByDate = {};
    dailyResult.forEach(item => {
        const counts = { regular: 0, vip: 0, couple: 0 };
        item.counts.forEach(c => {
            const key = mapSeatType[c.seatType];
            if (key) counts[key] = c.count;
        });
        mapByDate[item._id] = counts;
    });

    const result = [];
    for (let i = 0; i < 7; i++) {
        const d = startDate.add(i, "day").format("YYYY-MM-DD");
        result.push({
            date: d,
            regular: mapByDate[d]?.regular || 0,
            vip: mapByDate[d]?.vip || 0,
            couple: mapByDate[d]?.couple || 0,
        });
    }
    return result;
};

const fillMonthly = (monthlyResult) => {
    const now = dayjs();
    const year = now.year();
    const currentMonth = now.month(); // 0-based

    const mapSeatType = {
        "Ghế thường": "regular",
        "Ghế VIP": "vip",
        "Ghế đôi": "couple",
    };

    const mapByMonth = {};
    monthlyResult.forEach(item => {
        const counts = { regular: 0, vip: 0, couple: 0 };
        item.counts.forEach(c => {
            const key = mapSeatType[c.seatType];
            if (key) counts[key] = c.count;
        });
        mapByMonth[item._id] = counts;
    });

    const result = [];
    for (let m = 0; m <= currentMonth; m++) {
        const monthStr = dayjs().year(year).month(m).format("MM/YYYY");
        result.push({
            month: monthStr,
            regular: mapByMonth[monthStr]?.regular || 0,
            vip: mapByMonth[monthStr]?.vip || 0,
            couple: mapByMonth[monthStr]?.couple || 0,
        });
    }
    return result;
};


export const getTotalSeat = async (cinemaId) => {
    try {
        if (!cinemaId) throw new Error("Missing cinemaId");
        const cinemaObjectId = new ObjectId(cinemaId);

        const db = GET_DB();

        // Lấy dữ liệu daily
        const dailyResult = await db.collection("tickets").aggregate([
            { $match: { status: { $in: ["paid", "used"] } } },

            {
                $lookup: {
                    from: "showtimes",
                    localField: "showtimeId",
                    foreignField: "_id",
                    as: "showtime",
                },
            },
            { $unwind: "$showtime" },

            {
                $lookup: {
                    from: "screens",
                    localField: "showtime.screenId",
                    foreignField: "_id",
                    as: "screen",
                },
            },
            { $unwind: "$screen" },

            {
                $match: {
                    "screen.cinemaId": cinemaObjectId,
                },
            },

            {
                $lookup: {
                    from: "ticket_details",
                    localField: "_id",
                    foreignField: "ticketId",
                    as: "details",
                },
            },
            { $unwind: "$details" },

            {
                $lookup: {
                    from: "seats",
                    localField: "details.seatId",
                    foreignField: "_id",
                    as: "seat",
                },
            },
            { $unwind: "$seat" },

            {
                $project: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: { $toDate: "$createdAt" },
                            timezone: "+07:00"  // <-- thêm timezone ở đây
                        },
                    },
                    seatType: "$seat.type",
                },
            },

            {
                $group: {
                    _id: { date: "$date", seatType: "$seatType" },
                    count: { $sum: 1 },
                },
            },

            {
                $group: {
                    _id: "$_id.date",
                    counts: {
                        $push: {
                            seatType: "$_id.seatType",
                            count: "$count",
                        },
                    },
                },
            },

            { $sort: { _id: 1 } },
        ]).toArray();

        // Lấy dữ liệu monthly
        const monthlyResult = await db.collection("tickets").aggregate([
            { $match: { status: { $in: ["paid", "used"] } } },

            {
                $lookup: {
                    from: "showtimes",
                    localField: "showtimeId",
                    foreignField: "_id",
                    as: "showtime",
                },
            },
            { $unwind: "$showtime" },

            {
                $lookup: {
                    from: "screens",
                    localField: "showtime.screenId",
                    foreignField: "_id",
                    as: "screen",
                },
            },
            { $unwind: "$screen" },

            {
                $match: {
                    "screen.cinemaId": cinemaObjectId,
                },
            },

            {
                $lookup: {
                    from: "ticket_details",
                    localField: "_id",
                    foreignField: "ticketId",
                    as: "details",
                },
            },
            { $unwind: "$details" },

            {
                $lookup: {
                    from: "seats",
                    localField: "details.seatId",
                    foreignField: "_id",
                    as: "seat",
                },
            },
            { $unwind: "$seat" },

            {
                $project: {
                    month: {
                        $dateToString: {
                            format: "%m/%Y",
                            date: { $toDate: "$createdAt" },
                            timezone: "+07:00"  // <-- thêm timezone ở đây
                        },
                    },
                    seatType: "$seat.type",
                },
            },

            {
                $group: {
                    _id: { month: "$month", seatType: "$seatType" },
                    count: { $sum: 1 },
                },
            },

            {
                $group: {
                    _id: "$_id.month",
                    counts: {
                        $push: {
                            seatType: "$_id.seatType",
                            count: "$count",
                        },
                    },
                },
            },

            { $sort: { _id: 1 } },
        ]).toArray();

        const daily = fillDaily(dailyResult);
        const monthly = fillMonthly(monthlyResult);

        return { daily, monthly };
    } catch (error) {
        throw error;
    }
};

const getTop5RevenueCinemas = async () => {
    try {
        const db = GET_DB();

        // Lấy tất cả rạp để map id -> name
        const cinemas = await cinemaModel.getAll();
        const cinemaMap = {};
        cinemas.forEach(cinema => {
            cinemaMap[cinema._id.toString()] = cinema.name;
        });

        // Aggregate tính tổng doanh thu theo cinemaId
        const results = await db.collection("tickets").aggregate([
            {
                $match: { status: { $in: ["paid", "used"] } }
            },
            {
                $group: {
                    _id: "$cinemaId",
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $limit: 5
            }
        ]).toArray();

        // Chuyển doanh thu sang triệu đồng, lấy tên rạp
        const toMillion = value => Math.round(value / 1_000_000);

        const topCinemas = results.map(item => ({
            name: cinemaMap[item._id.toString()] || "Unknown",
            revenue: toMillion(item.totalRevenue)
        }));

        return topCinemas;

    } catch (error) {
        throw error;
    }
};



export const dashboardService = {
    getRevenueByCinema,
    getRevenueByMovie,
    getTotalSeat,
    getTop5RevenueCinemas
};
