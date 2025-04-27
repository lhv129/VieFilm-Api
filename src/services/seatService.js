import { screenModel } from "../models/screenModel";
import { seatModel } from "../models/seatModel"
import { showtimeModel } from "../models/showtimeModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getAll = async (req, res, next) => {
    try {
        const seats = await seatModel.getAll();
        return seats;
    } catch (error) {
        throw error;
    }
}

const createSeats = async (screenId, reqBody) => {
    try {
        // Kiểm tra xem phòng đó có tồn tại không
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại")
        }

        const data = [];
        const startCharCode = reqBody.startRow.toUpperCase().charCodeAt(0);
        const endCharCode = reqBody.endRow.toUpperCase().charCodeAt(0);

        if (startCharCode > endCharCode) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Hàng bắt đầu phải nhỏ hơn hoặc bằng hàng kết thúc")
        }

        for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {

            const rowLetter = String.fromCharCode(charCode);
            for (let i = 1; i <= reqBody.number; i++) {
                const newArray = {
                    screenId: reqBody.screenId,
                    row: rowLetter,
                    number: i,
                    type: reqBody.type,
                    price: reqBody.price,
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

const update = async (id, data) => {
    try {
        //Kiểm tra ghế đấy có tồn tại hay không
        const seat = await seatModel.findOneById(id);
        if (!seat) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại")
        }

        // Nếu có tồn tại thì cập nhật
        let newSeat = {
            ...data,
            seatCode: data.row + data.number,
            updatedAt: Date.now()
        };

        newSeat = await seatModel.update(id,newSeat);

        const getNewSeat = await seatModel.findOneById(id);

        return getNewSeat;
    } catch (error) {
        throw error;
    }
};

const getDelete = async (id) => {
    try {
        const seat = await seatModel.getDelete(id);
        if (seat.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại");
        }
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