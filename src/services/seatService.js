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
        let seats = []; // Đảm bảo có giá trị mặc định cho seats

        if (type === 'Ghế đôi') {
            // Giới hạn số lượng ghế đôi tối đa là 10
            if (number > 10) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Số lượng ghế đôi không được vượt quá 10");
            }

            // Kiểm tra phòng chiếu
            const screen = await screenModel.findOneById(screenId);
            if (!screen) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại");
            }

            if (screen.cinemaId.toString() !== cinemaId) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
            }

            const data = [];
            const startCharCode = startRow.toUpperCase().charCodeAt(0);
            const endCharCode = endRow.toUpperCase().charCodeAt(0);

            if (startCharCode > endCharCode) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Hàng bắt đầu phải nhỏ hơn hoặc bằng hàng kết thúc");
            }

            let seatCounter = 1; // Đếm số ghế để tạo seatCode

            for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {
                const rowLetter = String.fromCharCode(charCode);

                // Tạo ghế đôi (số lượng ghế đôi = number * 2)
                for (let i = 0; i < number; i++) {
                    // Tạo cặp ghế: ví dụ, A1 A2, A3 A4, A5 A6...
                    const seatCode = `${rowLetter}${seatCounter} ${rowLetter}${seatCounter + 1}`;

                    data.push({
                        screenId,
                        row: rowLetter,
                        number: seatCounter,
                        type,
                        price,
                        seatCode: seatCode,
                        status: "available",
                        _deletedAt: false
                    });

                    seatCounter += 2; // Tiến tới ghế tiếp theo (sau A1 A2 là A3 A4)
                }
            }

            // Lưu các ghế vào cơ sở dữ liệu
            seats = await seatModel.createSeats(screenId, data);

        } else {
            // Xử lý khi không phải Ghế đôi (Ghế thường hoặc Ghế VIP)
            const screen = await screenModel.findOneById(screenId);
            if (!screen) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại");
            }

            if (screen.cinemaId.toString() !== cinemaId) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
            }

            const data = [];
            const startCharCode = startRow.toUpperCase().charCodeAt(0);
            const endCharCode = endRow.toUpperCase().charCodeAt(0);

            if (startCharCode > endCharCode) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Hàng bắt đầu phải nhỏ hơn hoặc bằng hàng kết thúc");
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
                    };
                    data.push(newArray);
                }
            }

            seats = await seatModel.createSeats(screenId, data);
        }

        return seats;
    } catch (error) {
        throw error;
    }
};


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
        const { cinemaId, screenId, seatId, row, number, type, price,status } = data;

        // Kiểm tra xem phòng đó có tồn tại không
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại, vui lòng kiểm tra lại");
        }

        // Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }

        // Kiểm tra ghế đấy có tồn tại hay không
        const seat = await seatModel.findOneById(seatId);
        // Kiểm tra ghế đấy có trong phòng chiếu đó hay không
        if (seat.screenId.toString() !== screenId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại trong phòng chiếu này");
        }

        if (!seat) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Ghế không tồn tại");
        }

        // Chuyển row thành chữ hoa
        const upperCaseRow = row.toUpperCase();

        // Nếu là Ghế đôi, cần xử lý seatCode cho cả cặp ghế
        let newSeat;
        if (type === 'Ghế đôi') {
            // Kiểm tra và tạo seatCode cho ghế đôi
            const seatCode1 = `${upperCaseRow}${number * 2 - 1}`;  // Ghế đầu tiên của cặp
            const seatCode2 = `${upperCaseRow}${number * 2}`;      // Ghế thứ hai của cặp

            newSeat = {
                screenId: new ObjectId(screenId),
                row: upperCaseRow,
                number: number,
                type: type,
                price: price,
                status: status,
                seatCode: `${seatCode1} ${seatCode2}`,  // seatCode chứa cả 2 ghế của cặp
                updatedAt: Date.now(),
            };

        } else {
            // Nếu là Ghế thường hoặc Ghế VIP
            newSeat = {
                screenId: new ObjectId(screenId),
                row: upperCaseRow,
                number: number,
                type: type,
                price: price,
                status: status,
                seatCode: upperCaseRow   + number,  // seatCode cho ghế đơn
                updatedAt: Date.now(),
            };
        }

        // Cập nhật ghế
        newSeat = await seatModel.update(seatId, newSeat);

        // Lấy lại ghế đã cập nhật
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