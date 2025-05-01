import { number } from "joi";
import { screenModel } from "../models/screenModel";
import { seatModel } from "../models/seatModel"
import { showtimeModel } from "../models/showtimeModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";

const getAll = async (req, res, next) => {
    try {
        const seats = await seatModel.getAll();
        return seats;
    } catch (error) {
        throw error;
    }
}

const createSeats = async (reqBody) => {
    try {
        const { cinemaId, screenId, startRow, endRow, number, type, price } = reqBody;
        // Kiểm tra xem phòng đó có tồn tại không
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại")
        }
        //Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }

        const data = [];
        const startCharCode = startRow.toUpperCase().charCodeAt(0);
        const endCharCode = endRow.toUpperCase().charCodeAt(0);

        if (startCharCode > endCharCode) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Hàng bắt đầu phải nhỏ hơn hoặc bằng hàng kết thúc")
        }

        for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {

            const rowLetter = String.fromCharCode(charCode);
            for (let i = 1; i <= number; i++) {
                const newArray = {
                    screenId: screenId,
                    row: rowLetter,
                    number: i,
                    type: type,
                    price: price,
                    seatCode: `${rowLetter}${i}`,
                    status: "available",
                    _deletedAt: false
                }
                data.push(newArray);
            }
        }

        const seats = await seatModel.createSeats(screenId, data);

        return seats;
    } catch (error) {
        throw error;
    }
}

const getDetails = async (id) => {
    try {
        const seat = await seatModel.findOneById(id);
        if (!seat) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại");
        }
        return seat;
    } catch (error) {
        throw error;
    }
}

const getAllByScreen = async (screenId) => {
    try {
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng không tồn tại");
        }

        const seats = await seatModel.getAllByScreen(screenId);
        if (!seats) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chưa có ghế, vui lòng kiểm tra lại");
        }
        return seats;
    } catch (error) {
        throw error;
    }
}

const update = async (data) => {
    try {
        const { cinemaId, screenId, seatId } = data;
        // Kiểm tra xem phòng đó có tồn tại không
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại")
        }
        //Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }

        //Kiểm tra ghế đấy có tồn tại hay không
        const seat = await seatModel.findOneById(seatId);
        //Kiểm tra ghế đấy có trong phòng chiếu đó hay không
        if (seat.screenId.toString() !== screenId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại trong phòng chiếu này")
        }

        if (!seat) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại")
        }

        // Nếu có tồn tại thì cập nhật
        let newSeat = {
            screenId: new ObjectId(screenId),
            row: data.row,
            number: data.number,
            type: data.type,
            price: data.price,
            seatCode: data.row + data.number,
            updatedAt: Date.now()
        };

        newSeat = await seatModel.update(seatId, newSeat);

        const getNewSeat = await seatModel.findOneById(seatId);

        return getNewSeat;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (data) => {
    try {
        const { cinemaId, screenId, seatId } = data;
        // Kiểm tra xem phòng đó có tồn tại không
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại")
        }
        //Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }

        //Kiểm tra ghế đấy có tồn tại hay không
        const seat = await seatModel.findOneById(seatId);
        //Kiểm tra ghế đấy có trong phòng chiếu đó hay không
        if (seat.screenId.toString() !== screenId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại trong phòng chiếu này")
        }

        if (!seat) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại")
        }
        await seatModel.getDelete(seatId);

        return [];
    } catch (error) {
        throw error;
    }
}

export const seatService = {
    getAll,
    createSeats,
    getDetails,
    getAllByScreen,
    update,
    getDelete,
}