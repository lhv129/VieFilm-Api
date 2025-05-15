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


const getAll = async (req, res, next) => {
    try {
        const tickets = await ticketModel.getAll();
        return tickets
    } catch (error) {
        throw error;
    }
}

const staffCreateTicket = async (user, reqBody) => {
    try {
        const { showtimeId, seatIds, paymentMethodId, products, customer } = reqBody;
        const showtime = await showtimeModel.findOneById(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id suất chiếu không tồn tại");
        }
        const paymentMethod = await paymentMethodModel.findOneById(paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id phương thức thanh toán không tồn tại");
        }
        // Kiểm tra xem ghế đó có tồn tại không dựa vào collection seats
        const objectSeatIds = seatIds.map(id => new ObjectId(id));
        const seats = await seatModel.find({ _id: { $in: objectSeatIds }, _deletedAt: false, status: "available" });
        if (seats.length != seatIds.length) {
            const existingSeatIds = seats.map(seat => seat._id.toString());
            const nonExistingSeatIds = seatIds.filter(id => !existingSeatIds.includes(id));
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Các ghế có ID: ${nonExistingSeatIds} không tồn tại`);
        }
        // Lấy ra danh sách ghế của suất chiếu đó để kiểm tra ghế đã được đặt chưa thông qua suất chiếu đó
        const exitStingSeats = await showtimeModel.getSeatsByShowtime(showtimeId);
        for (const seat of exitStingSeats.screen.seats) {
            if (seat.isBooked && objectSeatIds.some(id => id.equals(seat._id))) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đã được đặt trước đó.`);
            }
        }
        const exitStingSeatsList = exitStingSeats.screen.seats;
        const rows = [...new Set(exitStingSeatsList.map(seat => seat.row))].sort(); // Lấy danh sách các hàng duy nhất và sắp xếp
        for (const row of rows) {
            const seatsInRow = exitStingSeatsList
                .filter(seat => seat.row === row)
                .sort((a, b) => a.number - b.number); // Lọc ghế theo hàng và sắp xếp theo số

            const bookedInRow = seatsInRow.filter(seat => seat.isBooked || objectSeatIds.some(id => id.equals(seat._id)));
            const bookedIndices = bookedInRow.map(seat => seatsInRow.findIndex(s => s._id.equals(seat._id))).sort((a, b) => a - b);

            // Kiểm tra không đặt ghế liền kề ghế đầu hoặc cuối hàng nếu ghế đầu hoặc cuối chưa được đặt
            const isFirstSeatBooked = bookedInRow.some(seat => seatsInRow[0]._id.equals(seat._id));
            const isLastSeatBooked = bookedInRow.some(seat => seatsInRow[seatsInRow.length - 1]._id.equals(seat._id));

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

            // Kiểm tra không đặt bỏ trống giữa các ghế đã đặt (chỉ kiểm tra các ghế liền kề)
            if (bookedIndices.length > 1) {
                // Sắp xếp lại các index đã đặt để dễ kiểm tra các ghế liền kề
                bookedIndices.sort((a, b) => a - b);

                for (let i = 0; i < bookedIndices.length - 1; i++) {
                    // Kiểm tra xem ghế tiếp theo có phải là ghế liền kề hay không
                    if (bookedIndices[i + 1] - bookedIndices[i] === 1) {
                        // Nếu là ghế liền kề, không cần kiểm tra khoảng trống
                        continue;
                    } else {
                        // Nếu không phải ghế liền kề, kiểm tra xem có ghế trống liền kề giữa chúng không
                        if (bookedIndices[i + 1] - bookedIndices[i] === 2) {
                            const emptySeatIndex = bookedIndices[i] + 1;
                            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế bỏ trống giữa các ghế đã chọn. Ghế ${seatsInRow[emptySeatIndex].seatCode} cần được đặt trước.`);
                        }
                    }
                }
            }
        }

        // Kiểm tra không đặt quá 8 ghế
        if (objectSeatIds.length > 8) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt quá 8 ghế cùng một lúc.`);
        }

        // Nếu chọn sản phẩm thì kiểm tra id sản phẩm đó có tồn tại không
        if (products) {
            // Trích xuất mảng productId từ mảng products
            const productIds = products.map(product => product.productId);
            // Kiểm tra xem sản phẩm đó có tồn tại không
            const objectProductIds = productIds.map(id => new ObjectId(id));
            const arrayProducts = await productModel.find({ _id: { $in: objectProductIds }, _deletedAt: false, status: "active" });
            if (arrayProducts.length != productIds.length) {
                const existingProductIds = arrayProducts.map(product => product._id.toString());
                const nonExistingProductIds = productIds.filter(id => !existingProductIds.includes(id));
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Products ID: ${nonExistingProductIds} không tồn tại`);
            }
        }
        const dataTicket = {
            staff: user.fullname,
            customer: customer,
            showtimeId: showtimeId,
            userId: user._id.toString(),
            paymentMethodId: paymentMethodId,
            code: randomCodeTicket.random()
        };
        // Tạo vé
        const ticket = await ticketModel.create(dataTicket);

        // Tạo chi tiết vé (ghế)
        const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(ticket.insertedId.toString(), seatIds);
        await ticketDetailModel.insertMany(ticketDetails);

        // Tính tổng giá tiền để cập nhật lại lên cho ticket đó
        const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticket.insertedId.toString()), _deletedAt: false })

        let totalTotalPriceTicketProductDetail = 0;
        if (products) {
            // Tạo chi tiết vé (sản phẩm)
            const ticketProductDetails = await ticketProductDetail.getTicketDetailsWithPriceFromProducts(ticket.insertedId.toString(), products);
            await ticketProductDetail.insertMany(ticketProductDetails);
            totalTotalPriceTicketProductDetail = await ticketProductDetail.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticket.insertedId.toString()), _deletedAt: false })
        } else {
            totalTotalPriceTicketProductDetail = 0;
        }
        // Có được tổng tiền thì update ngược lại cho ticket
        const totalAmount = getTotalPriceTicketDetail + totalTotalPriceTicketProductDetail;

        await ticketModel.updateTotalAmount(ticket.insertedId.toString(), totalAmount)

        const getTicket = await ticketModel.findOneById(ticket.insertedId.toString());

        return getTicket;
    } catch (error) {
        throw error;
    }
}


const create = async (user, reqBody) => {
    try {
        const { showtimeId, seatIds } = reqBody;
        const showtime = await showtimeModel.findOneById(showtimeId);
        if (!showtime) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id suất chiếu không tồn tại");
        }

        if(!seatIds || seatIds.length === 0){
            const ticketOld = await ticketModel.find({ userId: user._id, _deletedAt: false, status: "hold", showtimeId: new ObjectId(showtimeId) });
            await ticketModel.getDelete(ticketOld._id.toString());
            throw new ApiError(StatusCodes.NOT_FOUND, "Hủy giữ ghế thành công");
        }

        // Kiểm tra xem ghế đó có tồn tại không dựa vào collection seats
        const objectSeatIds = seatIds.map(id => new ObjectId(id));
        const seats = await seatModel.find({ _id: { $in: objectSeatIds }, _deletedAt: false, status: "available" });
        if (seats.length != seatIds.length) {
            const existingSeatIds = seats.map(seat => seat._id.toString());
            const nonExistingSeatIds = seatIds.filter(id => !existingSeatIds.includes(id));
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Các ghế có ID: ${nonExistingSeatIds} không tồn tại`);
        }
        // Lấy ra danh sách ghế của suất chiếu đó để kiểm tra ghế đã được đặt chưa thông qua suất chiếu đó
        const exitStingSeats = await showtimeModel.getSeatsByShowtime(showtimeId);
        for (const seat of exitStingSeats.screen.seats) {
            if (
                seat.isBooked &&
                seat.bookedBy?.toString() !== user._id.toString() &&
                objectSeatIds.some(id => id.equals(seat._id))
            ) {
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Ghế ${seat.seatCode} đã được đặt trước đó.`);
            }
        }
        const exitStingSeatsList = exitStingSeats.screen.seats;
        const rows = [...new Set(exitStingSeatsList.map(seat => seat.row))].sort(); // Lấy danh sách các hàng duy nhất và sắp xếp
        for (const row of rows) {
            const seatsInRow = exitStingSeatsList
                .filter(seat => seat.row === row)
                .sort((a, b) => a.number - b.number); // Lọc ghế theo hàng và sắp xếp theo số

            const bookedInRow = seatsInRow.filter(seat => seat.isBooked || objectSeatIds.some(id => id.equals(seat._id)));
            const bookedIndices = bookedInRow.map(seat => seatsInRow.findIndex(s => s._id.equals(seat._id))).sort((a, b) => a - b);

            // Kiểm tra không đặt ghế liền kề ghế đầu hoặc cuối hàng nếu ghế đầu hoặc cuối chưa được đặt
            const isFirstSeatBooked = bookedInRow.some(seat => seatsInRow[0]._id.equals(seat._id));
            const isLastSeatBooked = bookedInRow.some(seat => seatsInRow[seatsInRow.length - 1]._id.equals(seat._id));

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

            // Kiểm tra không đặt bỏ trống giữa các ghế đã đặt (chỉ kiểm tra các ghế liền kề)
            if (bookedIndices.length > 1) {
                // Sắp xếp lại các index đã đặt để dễ kiểm tra các ghế liền kề
                bookedIndices.sort((a, b) => a - b);

                for (let i = 0; i < bookedIndices.length - 1; i++) {
                    // Kiểm tra xem ghế tiếp theo có phải là ghế liền kề hay không
                    if (bookedIndices[i + 1] - bookedIndices[i] === 1) {
                        // Nếu là ghế liền kề, không cần kiểm tra khoảng trống
                        continue;
                    } else {
                        // Nếu không phải ghế liền kề, kiểm tra xem có ghế trống liền kề giữa chúng không
                        if (bookedIndices[i + 1] - bookedIndices[i] === 2) {
                            const emptySeatIndex = bookedIndices[i] + 1;
                            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt ghế bỏ trống giữa các ghế đã chọn. Ghế ${seatsInRow[emptySeatIndex].seatCode} cần được đặt trước.`);
                        }
                    }
                }
            }
        }

        // Kiểm tra không đặt quá 8 ghế
        if (objectSeatIds.length > 8) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Lỗi: Không được đặt quá 8 ghế cùng một lúc.`);
        }

        // === Logic chính xử lý giữ ghế ===
        let ticket = await ticketModel.findOne({
            userId: user._id,
            showtimeId: new ObjectId(showtimeId),
            status: "hold"
        });

        if (ticket) {
            // Nếu người dùng đó đã giữ ghế trong suất chiếu đó
            //Xóa những ticket_details
            await ticketDetailModel.deleteMany({ ticketId: new ObjectId(ticket._id) });

            // Tạo mới những ticket_details mới cho ticket đó
            const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(ticket._id.toString(), seatIds);
            await ticketDetailModel.insertMany(ticketDetails);

            // Tính tổng giá trị của ticket_details đó
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticket._id), _deletedAt: false })
            // Cập nhật ngược lại lên cho ticket
            await ticketModel.updateTotalAmount(ticket._id, getTotalPriceTicketDetail)
            ticket = await ticketModel.findOneById(ticket._id.toString());
        } else {
            // Nếu chưa có vé, tạo mới
            const dataTicket = {
                customer: user.fullname,
                showtimeId: showtimeId,
                userId: user._id.toString(),
                code: randomCodeTicket.random(),
                status: "hold",
            };
            // Tạo ra ticket mới
            const newTicket = await ticketModel.create(dataTicket);
            // Lấy ra danh sách details của ticket đó
            const ticketDetails = await ticketDetailModel.getTicketDetailsWithPriceFromSeats(newTicket.insertedId.toString(), seatIds);
            // Thêm ticket_details
            await ticketDetailModel.insertMany(ticketDetails);
            // Lấy ra tổng giá của ticket_details rồi cập nhật ngược lên cho ticket
            const getTotalPriceTicketDetail = await ticketDetailModel.getTotalPriceTicketDetails({ ticketId: new ObjectId(newTicket.insertedId.toString()), _deletedAt: false })
            await ticketModel.updateTotalAmount(newTicket.insertedId.toString(), getTotalPriceTicketDetail)
            ticket = await ticketModel.findOneById(newTicket.insertedId.toString());
        }
        return ticket;
    } catch (error) {
        throw error;
    }
}

const getDetails = async (id) => {
    try {
        const ticket = await ticketModel.getDetails(id);
        return ticket;
    } catch (error) {
        throw error;
    }
}

const updateStatus = async (id, status) => {
    try {
        await ticketModel.updateStatus(id, status);

        const getNewTicket = await ticketModel.findOneById(id);

        return getNewTicket;
    } catch (error) {
        throw error;
    }
}

const checkOut = async (reqBody) => {
    try {
        const { ticketId, paymentMethodId, products, promoId } = reqBody;
        let totalAmount = 0;

        const ticket = await ticketModel.findOneById(ticketId);
        if (!ticket) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id vé không tồn tại");
        }

        const paymentMethod = await paymentMethodModel.findOneById(paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Id phương thức thanh toán không tồn tại");
        }

        let discountPrice = 0;
        if (promoId) {
            const promoCode = await promoModel.findOneById(promoId);
            if (!promoCode) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Id mã giảm giá không tồn tại");
            }
            discountPrice = promoCode.price;
        }

        // Nếu chọn sản phẩm thì kiểm tra id sản phẩm đó có tồn tại không
        if (products) {
            // Trích xuất mảng productId từ mảng products
            const productIds = products.map(product => product.productId);
            // Kiểm tra xem sản phẩm đó có tồn tại không
            const objectProductIds = productIds.map(id => new ObjectId(id));
            const arrayProducts = await productModel.find({ _id: { $in: objectProductIds }, _deletedAt: false, status: "active" });
            if (arrayProducts.length != productIds.length) {
                const existingProductIds = arrayProducts.map(product => product._id.toString());
                const nonExistingProductIds = productIds.filter(id => !existingProductIds.includes(id));
                throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `Products ID: ${nonExistingProductIds} không tồn tại`);
            }
        }
        // Giới hạn sản phẩm nếu có
        if (products) {
            if (products.length > 10) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 sản phẩm");
            }

            const invalidQuantity = products.find(product => product.quantity > 10);
            if (invalidQuantity) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Không được chọn quá 10 cho mỗi sản phẩm");
            }
        }

        // Nếu người dùng mua trong sự cho phép thì tiếp tục
        let totalTotalPriceTicketProductDetail = 0;
        if (products) {
            // Tạo chi tiết vé (sản phẩm)
            const ticketProductDetails = await ticketProductDetail.getTicketDetailsWithPriceFromProducts(ticketId, products);
            await ticketProductDetail.insertMany(ticketProductDetails);
            totalTotalPriceTicketProductDetail = await ticketProductDetail.getTotalPriceTicketDetails({ ticketId: new ObjectId(ticketId), _deletedAt: false })
        } else {
            totalTotalPriceTicketProductDetail = 0;
        }

        totalAmount = ticket.totalAmount + totalTotalPriceTicketProductDetail - discountPrice;

        await ticketModel.updateTotalAmount(ticketId, totalAmount);
        //Cập nhật paymentMethodId vào trong ticket;
        await ticketModel.updateOne(ticketId, { paymentMethodId: new ObjectId(paymentMethodId) })

        const getTicket = await ticketModel.findOneById(ticket._id.toString());

        const url = paymentService.createPaymentUrl(getTicket);

        return url;

    } catch (error) {
        throw error;
    }
}

const deleteHoldsSeats = async (user,showtimeId) => {
    try {
        const ticket = await ticketModel.findOne({userId: user._id, showtimeId : new ObjectId(showtimeId)});
        if(!ticket){
            throw new ApiError(StatusCodes.NOT_FOUND, "Vé không tồn tại, vui lòng kiểm tra lại");
        }
        if(ticket.status != 'hold'){
            throw new ApiError(StatusCodes.BAD_REQUEST, "Vé này không trong trạng thái giữ");
        }
        await ticketModel.getDelete(ticket._id.toString());
        return [];
    } catch (error) {
        throw error;
    }
}

export const ticketService = {
    getAll,
    staffCreateTicket,
    create,
    getDetails,
    updateStatus,
    checkOut,
    deleteHoldsSeats
}