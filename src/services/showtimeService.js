import { movieModel } from "../models/movieModel";
import { screenModel } from "../models/screenModel";
import { showtimeModel } from "../models/showtimeModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { autoCalculateEndDate } from "../utils/autoCalculateEndDate";
import moment from "moment";
import { ObjectId } from "mongodb";
import { showtimeValidation } from "../validations/showtimeValidation";
import { cinemaModel } from "../models/cinemaModel";
import { timeUtils } from "../utils/timeUtils";

const getAll = async (reqBody) => {
    try {
        const showtimes = await showtimeModel.getAll(reqBody);
        return showtimes;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody) => {
    try {
        const { screenId, movieId, date, startTime } = reqBody;

        const movie = await movieModel.findOneById(movieId);
        if (!movie) {
            throw new ApiError(StatusCodes.NOT_FOUND, "MovieId không tồn tại, vui lòng kiểm tra lại");
        }
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "ScreenId không tồn tại, vui lòng kiểm tra lại");
        }
        // Kiểm tra date
        // Ngày chiếu phải là ngày hôm nay hoặc những ngày sắp tới
        // Ngày chiếu phải nằm trong thời gian công chiếu và kết thúc của phim
        showtimeValidation.validateDateAndStartTime(date, startTime, movie);

        const endTime = await autoCalculateEndDate.calculateEndTime(startTime, date, movie.duration);
        // Lấy ra toàn bộ danh sách showtime của phòng muốn thêm trong ngày hôm đó
        const existingShowtimes = await showtimeModel.find({ screenId: new ObjectId(screenId), date: date, _deletedAt: false })

        // Kiểm tra xem có suất chiếu nào bị trùng lịch không
        for (const existingShowtime of existingShowtimes) {
            // Chuyển đổi thời gian sang đối tượng Moment để so sánh
            const newStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
            const newEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

            // Tạo khoảng thời gian có buffer 15 phút cho suất chiếu mới và hiện có
            const newStartTimeWithBuffer = newStartTime.clone().subtract(15, 'minutes');
            const newEndTimeWithBuffer = newEndTime.clone().add(15, 'minutes');

            const existingStartTime = moment(`${existingShowtime.date} ${existingShowtime.startTime}`, 'YYYY-MM-DD HH:mm');
            const existingEndTime = moment(`${existingShowtime.date} ${existingShowtime.endTime}`, 'YYYY-MM-DD HH:mm');

            // Kiểm tra các trường hợp trùng lịch
            if (newStartTimeWithBuffer.isBefore(existingEndTime) && newEndTimeWithBuffer.isAfter(existingStartTime)) {
                // Format the conflicting showtime's details for the error message
                const existingShowtimeStartTimeFormatted = moment(existingStartTime).format('HH:mm');
                const existingShowtimeEndTimeFormatted = moment(existingEndTime).format('HH:mm');

                throw new ApiError(StatusCodes.CONFLICT, `Khung giờ chiếu bị trùng với suất chiếu từ ${existingShowtimeStartTimeFormatted} đến ${existingShowtimeEndTimeFormatted}`);
            }
        }

        const data = {
            ...reqBody,
            endTime: endTime,
        };
        const showtime = await showtimeModel.create(data);
        const getShowtime = await showtimeModel.findOneById(showtime.insertedId.toString());
        return getShowtime;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (id) => {
    try {
        const showtime = await showtimeModel.findOneById(id);
        return showtime;
    } catch (error) {
        throw error;
    }
}

const update = async (id, reqBody) => {
    try {
        const showtime = await showtimeModel.findOneById(id);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }

        const { screenId, movieId, date, startTime } = reqBody;
        const movie = await movieModel.findOneById(movieId);
        if (!movie) {
            throw new ApiError(StatusCodes.NOT_FOUND, "MovieId không tồn tại, vui lòng kiểm tra lại");
        }
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "ScreenId không tồn tại, vui lòng kiểm tra lại");
        }

        // Kiểm tra date
        // Ngày chiếu phải là ngày hôm nay hoặc những ngày sắp tới
        // Ngày chiếu phải nằm trong thời gian công chiếu và kết thúc của phim
        showtimeValidation.validateDateAndStartTime(date, startTime, movie);

        const endTime = await autoCalculateEndDate.calculateEndTime(startTime, date, movie.duration);
        // Lấy ra toàn bộ danh sách showtime của phòng muốn thêm trong ngày hôm đó
        const existingShowtimes = await showtimeModel.find({ screenId: new ObjectId(screenId), date: date, _deletedAt: false })

        // Loại bỏ suất chiếu đang được chỉnh sửa ra khỏi mảng
        const updatedShowtimes = existingShowtimes.filter(existingShowtime => existingShowtime._id.toString() !== id);

        // Kiểm tra xem có suất chiếu nào bị trùng lịch không
        for (const existingShowtime of updatedShowtimes) {
            // Chuyển đổi thời gian sang đối tượng Moment để so sánh
            const newStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
            const newEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

            // Tạo khoảng thời gian có buffer 15 phút cho suất chiếu mới và hiện có
            const newStartTimeWithBuffer = newStartTime.clone().subtract(15, 'minutes');
            const newEndTimeWithBuffer = newEndTime.clone().add(15, 'minutes');

            const existingStartTime = moment(`${existingShowtime.date} ${existingShowtime.startTime}`, 'YYYY-MM-DD HH:mm');
            const existingEndTime = moment(`${existingShowtime.date} ${existingShowtime.endTime}`, 'YYYY-MM-DD HH:mm');

            // Kiểm tra các trường hợp trùng lịch
            if (newStartTimeWithBuffer.isBefore(existingEndTime) && newEndTimeWithBuffer.isAfter(existingStartTime)) {
                // Format the conflicting showtime's details for the error message
                const existingShowtimeStartTimeFormatted = moment(existingStartTime).format('HH:mm');
                const existingShowtimeEndTimeFormatted = moment(existingEndTime).format('HH:mm');

                throw new ApiError(StatusCodes.CONFLICT, `Khung giờ chiếu bị trùng với suất chiếu từ ${existingShowtimeStartTimeFormatted} đến ${existingShowtimeEndTimeFormatted}`);
            }
        }

        const data = {
            ...reqBody,
            screenId: new ObjectId(screenId),
            movieId: new ObjectId(movieId),
            endTime: endTime,
            updatedAt: Date.now()
        };
        await showtimeModel.update(id, data);
        const getShowtime = await showtimeModel.findOneById(showtime._id.toString());
        return getShowtime;
    } catch (error) {
        throw error;
    }
}

const getDelete = async (reqBody) => {
    try {
        const id = reqBody.showtimeId;
        const showtime = await showtimeModel.findOneById(id);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }
        await showtimeModel.getDelete(id);
        return [];
    } catch (error) {
        throw error;
    }
}

const getSeatsByShowtime = async (showtimeId) => {
    try {
        const showtime = await showtimeModel.getSeatsByShowtime(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại, vui lòng kiểm tra lại");
        }
        return showtime;
    } catch (error) {
        throw error;
    }
}

const getAllByMovie = async (reqBody) => {
    try {
        const { cinemaId, movieId } = reqBody;
        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại vui lòng kiểm tra lại");
        }
        const movie = await movieModel.findOneById(movieId);
        if (!movie) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phim không tồn tại, vui lòng kiểm tra lại");
        }

        // Bước 1: Lấy danh sách screenId thuộc cinemaId
        const screens = await screenModel.find({ cinemaId: new ObjectId(cinemaId), _deletedAt: false });
        const screenIds = screens.map(screen => screen._id);
        if (screenIds.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng chiếu thuộc rạp này");
        }

        const showtimes = await showtimeModel.find({
            screenId: { $in: screenIds },
            movieId: new ObjectId(movieId),
            _deletedAt: false
        });

        const today = moment().startOf('day');

        const validShowtimes = showtimes.filter(showtime => {
            const showtimeDate = moment(showtime.date, 'DD/MM/YYYY');
            return showtimeDate.isSameOrAfter(today);
        });

        // Đếm tổng số ghế đang trống của suất chiếu đó
        // Lấy danh sách ghế từng suất chiếu
        const showtimesWithSeats = await Promise.all(
            validShowtimes.map(async (showtime) => {
                // Gọi getSeatsByShowtime
                const { screen } = await getSeatsByShowtime(showtime._id);

                // screen.seats là array ghế
                const totalEmptySeats = screen.seats.filter(seat => !seat.isBooked).length;

                // Gắn thêm field emptySeats
                return {
                    ...showtime,
                    emptySeats: totalEmptySeats
                };
            })
        );

        return showtimesWithSeats;
    } catch (error) {
        throw error;
    }
}

const getAllShowtimeByCinemaGroupedByMovie = async (reqBody) => {
    try {
        const { cinemaId, date } = reqBody;

        if (!cinemaId || !date) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu cinemaId hoặc date");
        }

        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại, vui lòng kiểm tra lại");
        }

        // 1. Lấy các screen thuộc cinema
        const screens = await screenModel.find({ cinemaId: new ObjectId(cinemaId), _deletedAt: false });
        const screenIds = screens.map(screen => screen._id);
        if (screenIds.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phòng chiếu nào thuộc rạp này");
        }

        // 2. Lấy showtimes trong ngày
        const showtimes = await showtimeModel.find({
            screenId: { $in: screenIds },
            date: date,
            _deletedAt: false
        });

        if (showtimes.length === 0) {
            return {
                status: "success",
                message: "Không có suất chiếu nào trong ngày",
                data: []
            };
        }

        // 3. Gom suất chiếu theo movieId
        const movieMap = new Map(); // key: movieId, value: { movieInfo, showtimes[] }

        for (const showtime of showtimes) {
            const { screen } = await getSeatsByShowtime(showtime._id);
            const emptySeats = screen.seats.filter(seat => !seat.isBooked).length;

            const movieIdStr = showtime.movieId.toString();

            // Nếu movie chưa tồn tại trong map, fetch và khởi tạo
            if (!movieMap.has(movieIdStr)) {
                const movie = await movieModel.findOneById(showtime.movieId);
                if (!movie) continue;

                movieMap.set(movieIdStr, {
                    _id: movie._id,
                    title: movie.title,
                    poster: movie.poster,
                    genres: movie.genres,
                    trailer: movie.trailer,
                    duration: movie.duration,
                    ageRating: movie.ageRating,
                    showtimes: []
                });
            }

            movieMap.get(movieIdStr).showtimes.push({
                _id: showtime._id,
                screenId: showtime.screenId,
                startTime: showtime.startTime,
                endTime: showtime.endTime,
                date: showtime.date,
                emptySeats
            });
        }

        const result = Array.from(movieMap.values());

        return result;
    } catch (error) {
        throw error;
    }
};

const getAllByScreen = async (reqBody) => {
    try {
        const { screenId, date } = reqBody;
        const showtimes = await showtimeModel.find({
            screenId: new ObjectId(screenId),
            date: date,
        });
        return showtimes;
    } catch (error) {
        throw error;
    }
}

const getEmptyShowtime = async (reqBody) => {
  try {
    const { screenId, date, movieId } = reqBody;

    // 1. Lấy danh sách suất chiếu hiện có
    const showtimes = await showtimeModel.find({
      screenId: new ObjectId(screenId),
      date: date,
    });

    // 2. Lấy duration phim từ movieId
    const movie = await movieModel.findOneById(movieId);
    if (!movie) throw new Error("Movie not found");
    const duration = movie.duration; // phút, ví dụ 120

    // 3. Sắp xếp suất chiếu hiện có theo startTime (theo phút)
    const sortedShowtimes = showtimes
      .map(st => ({
        startTime: st.startTime,
        endTime: st.endTime,
        startMinutes: timeUtils.timeToMinutes(st.startTime),
        endMinutes: timeUtils.timeToMinutes(st.endTime)
      }))
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const openTime = timeUtils.timeToMinutes("08:00");
    const closeTime = timeUtils.timeToMinutes("22:00");
    const buffer = 15;

    let availableTimes = [];
    let currentTime = openTime;

    while (currentTime + duration <= closeTime) {
      // Tạo đối tượng giả cho suất chiếu mới
      const newShowtime = {
        startTime: timeUtils.minutesToTime(currentTime),
        endTime: timeUtils.minutesToTime(currentTime + duration)
      };

      // Kiểm tra xung đột với tất cả suất chiếu hiện tại
      const conflict = sortedShowtimes.some(st => {
        return (
          currentTime < st.endMinutes + buffer &&
          currentTime + duration + buffer > st.startMinutes
        );
      });

      if (!conflict) {
        availableTimes.push(newShowtime.startTime);
        // Cập nhật currentTime sang sau suất chiếu này + buffer
        currentTime = currentTime + duration + buffer;
      } else {
        // Nếu có xung đột, tăng currentTime thêm 5 phút rồi thử lại
        currentTime += 5;
      }
    }

    return availableTimes;

  } catch (error) {
    throw error;
  }
};




export const showtimeService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getSeatsByShowtime,
    getAllByMovie,
    getAllShowtimeByCinemaGroupedByMovie,
    getAllByScreen,
    getEmptyShowtime
};
