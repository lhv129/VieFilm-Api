import { paymentMethodModel } from "../models/paymentMethodModel";
import { productModel } from "../models/productModel";
import { seatModel } from "../models/seatModel";
import { showtimeModel } from "../models/showtimeModel";
import { ticketDetailModel } from "../models/ticketDetailModel";
import { ticketModel } from "../models/ticketModel";
import { ticketProductDetail } from "../models/ticketProductDetailModel";
import ApiError from "../utils/ApiError";
import { randomCodeTicket } from "../utils/randomCodeTick";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { paymentService } from "./paymentService";
import { promoModel } from "../models/promoModel";
import { cinemaModel } from "../models/cinemaModel";


const getAll = async (reqBody) => {
    try {
        const {code,cinemaId} = reqBody;
        const tickets = await ticketModel.getAll(reqBody);
        return tickets
    } catch (error) {
        throw error;
    }
}

const getOneByUser = async (user, reqBody) => {
    try {
        const { ticketId } = reqBody
        const tickets = await ticketModel.getOneByUser(user._id, ticketId);
        return tickets
    } catch (error) {
        throw error;
    }
}

const parseDateToRange = (dateStr) => {
    const [dd, mm, yyyy] = dateStr.split('/').map(Number);
    const startOfDay = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime();
    const endOfDay = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999).getTime();
    return { startOfDay, endOfDay };
};

const getAllByUser = async (user, reqBody) => {
    try {
        const { page, limit, date } = reqBody;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 5;

        let dateFilter = {};
        if (date) {
            const { startOfDay, endOfDay } = parseDateToRange(date);
            dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        }

        const tickets = await ticketModel.getAllByUser(user._id, pageNumber, limitNumber, dateFilter);
        return tickets;
    } catch (error) {
        throw error;
    }
};


const staffCreateTicket = async (user, reqBody) => {
    try {
        const { showtimeId, seatIds, cinemaId } = reqBody;
        const showtime = await showtimeModel.findOneById(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại");
        }

        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }

        if (!seatIds || seatIds.length === 0) {
            const ticketOld = await ticketModel.findOne({ userId: user._id, _deletedAt: false, status: "hold", showtimeId: new ObjectId(showtimeId) });
            await ticketModel.getDelete(ticketOld._id.toString());
            return [];
        }

        const objectSeatIds = seatIds.map(id => new ObjectId(id));
        const seats = await seatModel.find({ _id: { $in: objectSeatIds }, _deletedAt: false, status: "available" });
        if (seats.length != seatIds.length) {
            const existingSeatIds = seats.map(seat => seat._id.toString());
            const nonExistingSeatIds = seatIds.filter(id => !existingSeatIds.includes(id));
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Các ghế có ID: ${nonExistingSeatIds} không tồn tại`);
        }

        const exitStingSeats = await showtimeModel.getSeatsByShowtime(showtimeId);

        for (const seat of exitStingSeats.screen.seats) {
            const isSelected = objectSeatIds.some(id => id.equals(seat._id));

            if (seat.isBooked === "paid" && isSelected) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đã được thanh toán, không thể giữ lại.`);
            }

            if (seat.isBooked === "hold" && seat.bookedBy?.toString() !== user._id.toString() && isSelected) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đang được giữ bởi người dùng khác.`);
            }
        }

        const exitStingSeatsList = exitStingSeats.screen.seats;
        const rows = [...new Set(exitStingSeatsList.map(seat => seat.row))].sort();

        for (const row of rows) {
            const seatsInRow = exitStingSeatsList
                .filter(seat => seat.row === row)
                .sort((a, b) => a.number - b.number);

            const selectedIndices = seatsInRow
                .map((seat, index) => ({ seat, index }))
                .filter(({ seat }) => objectSeatIds.some(id => id.equals(seat._id)))
                .map(({ index }) => index)
                .sort((a, b) => a - b);

            const isFirstSeatBooked = selectedIndices.includes(0) || seatsInRow[0].isBooked;
            const isLastSeatBooked = selectedIndices.includes(seatsInRow.length - 1) || seatsInRow[seatsInRow.length - 1].isBooked;

            if (!isFirstSeatBooked && seatsInRow.length > 1) {
                const secondSeatIndex = 1;
                if (objectSeatIds.some(id => seatsInRow[secondSeatIndex]._id.equals(id))) {
                    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế ${seatsInRow[secondSeatIndex].seatCode} khi ghế đầu tiên (${seatsInRow[0].seatCode}) chưa được đặt.`);
                }
            }

            if (!isLastSeatBooked && seatsInRow.length > 1) {
                const secondLastSeatIndex = seatsInRow.length - 2;
                if (objectSeatIds.some(id => seatsInRow[secondLastSeatIndex]._id.equals(id))) {
                    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế ${seatsInRow[secondLastSeatIndex].seatCode} khi ghế cuối cùng (${seatsInRow[seatsInRow.length - 1].seatCode}) chưa được đặt.`);
                }
            }

            if (selectedIndices.length > 1) {
                for (let i = 0; i < selectedIndices.length - 1; i++) {
                    if (selectedIndices[i + 1] - selectedIndices[i] === 2) {
                        const emptySeatIndex = selectedIndices[i] + 1;
                        const emptySeat = seatsInRow[emptySeatIndex];
                        if (
                            emptySeat.status === "available" &&
                            (!emptySeat.isBooked || emptySeat.isBooked === "available")
                        ) {
                            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được bỏ trống ghế ở giữa. Ghế ${emptySeat.seatCode} cần được đặt.`);
                        }
                    }
                }
            }
        }

        if (objectSeatIds.length > 8) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt quá 8 ghế cùng một lúc.`);
        }

        let ticket = await ticketModel.findOne({
            userId: user._id,
            showtimeId: new ObjectId(showtimeId),
            status: "hold"
        });

        if (ticket) {
            // B1: Lấy danh sách seatIds hiện tại trong ticket_details
            const existingDetails = await ticketDetailModel.find({ ticketId: new ObjectId(ticket._id), _deletedAt: false });
            const existingSeatIds = existingDetails.map(detail => detail.seatId.toString());

            // B2: So sánh
            const newSeatIdSet = new Set(seatIds);
            const existingSeatIdSet = new Set(existingSeatIds);

            const toInsertSeatIds = seatIds.filter(id => !existingSeatIdSet.has(id));
            const toDeleteSeatIds = existingSeatIds.filter(id => !newSeatIdSet.has(id));

            // B3: Xóa những ghế không còn được giữ
            if (toDeleteSeatIds.length > 0) {
                await ticketDetailModel.deleteMany({
                    ticketId: new ObjectId(ticket._id),
                    seatId: { $in: toDeleteSeatIds.map(id => new ObjectId(id)) }
                });
            }

            // B4: Thêm mới những ghế chưa có
            if (toInsertSeatIds.length > 0) {
                const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(ticket._id.toString(), toInsertSeatIds);
                await ticketDetailModel.insertMany(ticketDetails);
            }

            // B5: Cập nhật lại tổng tiền
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticket._id), _deletedAt: false });
            await ticketModel.updateTotalAmount(ticket._id, getTotalPriceTicketDetail);
            ticket = await ticketModel.findOneById(ticket._id.toString());
        } else {
            const dataTicket = {
                showtimeId: showtimeId,
                code: randomCodeTicket.random(),
                cinemaId: cinemaId,
                status: "hold",
                expireAt: new Date(Date.now() + 10 * 60 * 1000)
            };
            const newTicket = await ticketModel.staffCreate(dataTicket);
            const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(newTicket.insertedId.toString(), seatIds);
            await ticketDetailModel.insertMany(ticketDetails);
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(newTicket.insertedId.toString()), _deletedAt: false });
            await ticketModel.updateTotalAmount(newTicket.insertedId.toString(), getTotalPriceTicketDetail);
            ticket = await ticketModel.findOneById(newTicket.insertedId.toString());
        }
        return ticket;
    } catch (error) {
        throw error;
    }
}

const create = async (user, reqBody) => {
    try {
        const { showtimeId, seatIds, cinemaId } = reqBody;
        const showtime = await showtimeModel.findOneById(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Suất chiếu không tồn tại");
        }

        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại");
        }

        if (!seatIds || seatIds.length === 0) {
            const ticketOld = await ticketModel.findOne({ userId: user._id, _deletedAt: false, status: "hold", showtimeId: new ObjectId(showtimeId) });
            await ticketModel.getDelete(ticketOld._id.toString());
            return [];
        }

        const objectSeatIds = seatIds.map(id => new ObjectId(id));
        const seats = await seatModel.find({ _id: { $in: objectSeatIds }, _deletedAt: false, status: "available" });
        if (seats.length != seatIds.length) {
            const existingSeatIds = seats.map(seat => seat._id.toString());
            const nonExistingSeatIds = seatIds.filter(id => !existingSeatIds.includes(id));
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Các ghế có ID: ${nonExistingSeatIds} không tồn tại`);
        }

        const exitStingSeats = await showtimeModel.getSeatsByShowtime(showtimeId);

        for (const seat of exitStingSeats.screen.seats) {
            const isSelected = objectSeatIds.some(id => id.equals(seat._id));

            if (seat.isBooked === "paid" && isSelected) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đã được thanh toán, không thể giữ lại.`);
            }

            if (seat.isBooked === "hold" && seat.bookedBy?.toString() !== user._id.toString() && isSelected) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đang được giữ bởi người dùng khác.`);
            }
        }

        const exitStingSeatsList = exitStingSeats.screen.seats;
        const rows = [...new Set(exitStingSeatsList.map(seat => seat.row))].sort();

        for (const row of rows) {
            const seatsInRow = exitStingSeatsList
                .filter(seat => seat.row === row)
                .sort((a, b) => a.number - b.number);

            const selectedIndices = seatsInRow
                .map((seat, index) => ({ seat, index }))
                .filter(({ seat }) => objectSeatIds.some(id => id.equals(seat._id)))
                .map(({ index }) => index)
                .sort((a, b) => a - b);

            const isFirstSeatBooked = selectedIndices.includes(0) || seatsInRow[0].isBooked;
            const isLastSeatBooked = selectedIndices.includes(seatsInRow.length - 1) || seatsInRow[seatsInRow.length - 1].isBooked;

            if (!isFirstSeatBooked && seatsInRow.length > 1) {
                const secondSeatIndex = 1;
                if (objectSeatIds.some(id => seatsInRow[secondSeatIndex]._id.equals(id))) {
                    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế ${seatsInRow[secondSeatIndex].seatCode} khi ghế đầu tiên (${seatsInRow[0].seatCode}) chưa được đặt.`);
                }
            }

            if (!isLastSeatBooked && seatsInRow.length > 1) {
                const secondLastSeatIndex = seatsInRow.length - 2;
                if (objectSeatIds.some(id => seatsInRow[secondLastSeatIndex]._id.equals(id))) {
                    throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế ${seatsInRow[secondLastSeatIndex].seatCode} khi ghế cuối cùng (${seatsInRow[seatsInRow.length - 1].seatCode}) chưa được đặt.`);
                }
            }

            if (selectedIndices.length > 1) {
                for (let i = 0; i < selectedIndices.length - 1; i++) {
                    if (selectedIndices[i + 1] - selectedIndices[i] === 2) {
                        const emptySeatIndex = selectedIndices[i] + 1;
                        const emptySeat = seatsInRow[emptySeatIndex];
                        if (
                            emptySeat.status === "available" &&
                            (!emptySeat.isBooked || emptySeat.isBooked === "available")
                        ) {
                            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được bỏ trống ghế ở giữa. Ghế ${emptySeat.seatCode} cần được đặt.`);
                        }
                    }
                }
            }
        }

        if (objectSeatIds.length > 8) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt quá 8 ghế cùng một lúc.`);
        }

        let ticket = await ticketModel.findOne({
            userId: user._id,
            showtimeId: new ObjectId(showtimeId),
            status: "hold"
        });

        if (ticket) {
            // B1: Lấy danh sách seatIds hiện tại trong ticket_details
            const existingDetails = await ticketDetailModel.find({ ticketId: new ObjectId(ticket._id), _deletedAt: false });
            const existingSeatIds = existingDetails.map(detail => detail.seatId.toString());

            // B2: So sánh
            const newSeatIdSet = new Set(seatIds);
            const existingSeatIdSet = new Set(existingSeatIds);

            const toInsertSeatIds = seatIds.filter(id => !existingSeatIdSet.has(id));
            const toDeleteSeatIds = existingSeatIds.filter(id => !newSeatIdSet.has(id));

            // B3: Xóa những ghế không còn được giữ
            if (toDeleteSeatIds.length > 0) {
                await ticketDetailModel.deleteMany({
                    ticketId: new ObjectId(ticket._id),
                    seatId: { $in: toDeleteSeatIds.map(id => new ObjectId(id)) }
                });
            }

            // B4: Thêm mới những ghế chưa có
            if (toInsertSeatIds.length > 0) {
                const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(ticket._id.toString(), toInsertSeatIds);
                await ticketDetailModel.insertMany(ticketDetails);
            }

            // B5: Cập nhật lại tổng tiền
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticket._id), _deletedAt: false });
            await ticketModel.updateTotalAmount(ticket._id, getTotalPriceTicketDetail);
            ticket = await ticketModel.findOneById(ticket._id.toString());
        } else {
            const dataTicket = {
                customer: user.fullname,
                showtimeId: showtimeId,
                userId: user._id.toString(),
                code: randomCodeTicket.random(),
                cinemaId: cinemaId,
                status: "hold",
                expireAt: new Date(Date.now() + 10 * 60 * 1000)
            };
            const newTicket = await ticketModel.create(dataTicket);
            const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(newTicket.insertedId.toString(), seatIds);
            await ticketDetailModel.insertMany(ticketDetails);
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(newTicket.insertedId.toString()), _deletedAt: false });
            await ticketModel.updateTotalAmount(newTicket.insertedId.toString(), getTotalPriceTicketDetail);
            ticket = await ticketModel.findOneById(newTicket.insertedId.toString());
        }
        return ticket;
    } catch (error) {
        throw error;
    }
};


const getDetails = async (id) => {
    try {
        const ticket = await ticketModel.getDetails(id);
        return ticket;
    } catch (error) {
        throw error;
    }
}

const updateStatus = async (id, reqBody, status) => {
    try {
        const { cinemaId } = reqBody;

        const ticket = await ticketModel.findOneById(id);
        if (!ticket) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy vé");

        const cinema = await cinemaModel.findOneById(ticket.cinemaId.toString());
        if (cinemaId != ticket.cinemaId.toString()) {
            throw new ApiError(StatusCodes.BAD_GATEWAY, `Vui lòng đến rạp ${cinema.name} để nhận vé xem phim`);
        }

        if(ticket.status === "used"){
            throw new ApiError(StatusCodes.BAD_REQUEST, "Vé đã sử dụng rồi, vui lòng kiểm tra lại")
        }

        // ✅ Lấy thông tin showtime
        const showtime = await showtimeModel.findOneById(ticket.showtimeId.toString());
        if (!showtime) throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy lịch chiếu");

        // ✅ Chuyển "dd/mm/yyyy" thành Date
        const [day, month, year] = showtime.date.split('/').map(Number);
        const showDate = new Date(year, month - 1, day); // month bắt đầu từ 0

        // ✅ Lấy ngày hiện tại
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        showDate.setHours(0, 0, 0, 0);

        if (showDate.getTime() !== today.getTime()) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Chỉ được phép in vé vào đúng ngày chiếu ${showtime.date}`
            );
        }

        // ✅ Cập nhật status nếu hợp lệ
        await ticketModel.updateStatus(id, status);
        const getNewTicket = await ticketModel.findOneById(id);

        return getNewTicket;
    } catch (error) {
        throw error;
    }
};

const checkOut = async (reqBody) => {
    try {
        const { ticketId, paymentMethodId, products = [], promoName } = reqBody;

        const ticket = await ticketModel.findOneById(ticketId);
        if (!ticket) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id vé không tồn tại");
        }

        const paymentMethod = await paymentMethodModel.findOneById(paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id phương thức thanh toán không tồn tại");
        }

        let discountPrice = 0;
        if (promoName) {
            const promoCode = await promoModel.find({ name: promoName });
            if (promoCode.length === 0) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
            }
            discountPrice = promoCode[0].price;
            // Cập nhật discountPrice vào ticket
            await ticketModel.updateOne(ticketId, { discountPrice: discountPrice });
        }

        // Kiểm tra sản phẩm nếu có
        if (products.length > 0) {
            if (products.length > 10) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 sản phẩm");
            }

            const invalidProduct = products.find(p => p.quantity > 10);
            if (invalidProduct) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 cho mỗi sản phẩm");
            }

            const productIds = products.map(p => new ObjectId(p.productId));
            const existingProducts = await productModel.find({ _id: { $in: productIds }, _deletedAt: false, status: "active" });

            if (existingProducts.length !== products.length) {
                const existingIds = existingProducts.map(p => p._id.toString());
                const nonExistingIds = products.map(p => p.productId).filter(id => !existingIds.includes(id));
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Products ID: ${nonExistingIds} không tồn tại`);
            }
        }

        // Tính tổng giá sản phẩm
        let totalProductAmount = 0;
        if (products.length > 0) {
            if (products.length > 0) {
                await ticketProductDetail.deleteMany({ ticketId: new ObjectId(ticketId) });

                // Tạo lại chi tiết sản phẩm
                const ticketProductDetails = await ticketProductDetail.getTicketDetailsWithPriceFromProducts(ticketId, products);
                await ticketProductDetail.insertMany(ticketProductDetails);

                // Tính lại tổng giá trị chi tiết sản phẩm
                totalProductAmount = await ticketProductDetail.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticketId), _deletedAt: false });
            }

        }

        const totalAmount = ticket.baseAmount + totalProductAmount - discountPrice;

        // Cập nhật vé
        await ticketModel.updateTotalAmountAfterProduct(ticketId, totalAmount);
        await ticketModel.updateOne(ticketId, { paymentMethodId: new ObjectId(paymentMethodId) });

        const updatedTicket = await ticketModel.findOneById(ticketId);

        return paymentService.createPaymentUrl(updatedTicket);

    } catch (error) {
        throw error;
    }
};

const staffCheckOut = async (reqBody) => {
    try {
        const { ticketId, paymentMethodId, products = [], promoName, customer } = reqBody;

        const ticket = await ticketModel.findOneById(ticketId);
        if (!ticket) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Vé không tồn tại");
        }

        const paymentMethod = await paymentMethodModel.findOneById(paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phương thức thanh toán không tồn tại");
        }

        if (!customer) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Tên khách hàng không được để trống");
        }

        let discountPrice = 0;
        if (promoName) {
            const promoCode = await promoModel.find({ name: promoName });
            if (promoCode.length === 0) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Mã giảm giá không tồn tại");
            }
            discountPrice = promoCode[0].price;
            // Cập nhật discountPrice vào ticket
            await ticketModel.updateOne(ticketId, { discountPrice: discountPrice });
        }

        // Kiểm tra sản phẩm nếu có
        if (products.length > 0) {
            if (products.length > 10) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 sản phẩm");
            }

            const invalidProduct = products.find(p => p.quantity > 10);
            if (invalidProduct) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 cho mỗi sản phẩm");
            }

            const productIds = products.map(p => new ObjectId(p.productId));
            const existingProducts = await productModel.find({ _id: { $in: productIds }, _deletedAt: false, status: "active" });

            if (existingProducts.length !== products.length) {
                const existingIds = existingProducts.map(p => p._id.toString());
                const nonExistingIds = products.map(p => p.productId).filter(id => !existingIds.includes(id));
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Products ID: ${nonExistingIds} không tồn tại`);
            }
        }

        // Tính tổng giá sản phẩm
        let totalProductAmount = 0;
        if (products.length > 0) {
            if (products.length > 0) {
                await ticketProductDetail.deleteMany({ ticketId: new ObjectId(ticketId) });

                // Tạo lại chi tiết sản phẩm
                const ticketProductDetails = await ticketProductDetail.getTicketDetailsWithPriceFromProducts(ticketId, products);
                await ticketProductDetail.insertMany(ticketProductDetails);

                // Tính lại tổng giá trị chi tiết sản phẩm
                totalProductAmount = await ticketProductDetail.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticketId), _deletedAt: false });
            }

        }

        const totalAmount = ticket.baseAmount + totalProductAmount - discountPrice;

        // Cập nhật vé
        await ticketModel.updateTotalAmountAfterProduct(ticketId, totalAmount);

        await ticketModel.updateOne(ticketId, { paymentMethodId: new ObjectId(paymentMethodId), customer: customer, updatedAt: Date.now(), status: "paid" });

        const updatedTicket = await ticketModel.findOneById(ticketId);

        return updatedTicket;

    } catch (error) {
        throw error;
    }
};


const deleteHoldsSeats = async (user, ticketId) => {
    try {
        const ticket = await ticketModel.findOne({ userId: user._id, _id: new ObjectId(ticketId) });
        if (!ticket) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Vé không tồn tại hoặc không phải vé của bạn, vui lòng kiểm tra lại");
        }
        if (ticket.status != 'hold') {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Vé này không trong trạng thái giữ");
        }
        await ticketModel.getDelete(ticket._id.toString());
        return [];
    } catch (error) {
        throw error;
    }
}

// totalAmount là tổng tiền
// baseAmount là tổng tiền của ghế (đã giảm giá nếu có)
// discountPrice là số tiền đã giảm
// Nếu muốn tính số tiền chưa giảm thì totalAmount + discoutPrice

export const ticketService = {
    getAll,
    getOneByUser,
    getAllByUser,
    staffCreateTicket,
    create,
    getDetails,
    updateStatus,
    checkOut,
    staffCheckOut,
    deleteHoldsSeats
}