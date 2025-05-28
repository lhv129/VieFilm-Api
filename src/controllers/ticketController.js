import { ticketModel } from "../models/ticketModel";
import { ticketService } from "../services/ticketService";



const getAll = async (req, res, next) => {
    try {
        const tickets = await ticketService.getAll();
        res.status(200).json({
            status: "success",
            message: "Lấy danh sách vé thành công",
            data: tickets
        })
    } catch (error) {
        next(error)
    }
}

const getOneByUser = async (req, res, next) => {
    try {
        const tickets = await ticketService.getOneByUser(req.user, req.body);
        res.status(200).json({
            status: "success",
            message: "Lấy chi tiết vé thành công",
            data: tickets
        })
    } catch (error) {
        next(error)
    }
}

const getAllByUser = async (req, res, next) => {
    try {
        const tickets = await ticketService.getAllByUser(req.user, req.body);
        res.status(200).json({
            status: "success",
            message: "Lấy danh sách vé thành công",
            data: tickets.data,
            pagination: tickets.pagination
        });
    } catch (error) {
        next(error)
    }
}

const staffCreateTicket = async (req, res, next) => {
    try {
        const user = req.user;
        const tickets = await ticketService.staffCreateTicket(user, req.body);
        res.status(201).json({
            status: "success",
            message: "Tạo vé thành công",
            data: tickets
        })
    } catch (error) {
        next(error)
    }
}

// còn 1 case chưa hoàn thành đó là:
// Nếu showtimeId ở rạp A mà nhập cinemaId là rạp B thì chắc vẫn đặt được :3 tại case này mình chưa check
const create = async (req, res, next) => {
    try {
        const user = req.user;
        const tickets = await ticketService.create(user, req.body);
        res.status(201).json({
            status: "success",
            message: "Giữ ghế thành công",
            data: Array.isArray(tickets) ? tickets : tickets ? [tickets] : []
        })
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const ticket = await ticketService.getDetails(req.params.id)
        return res.status(201).json({
            status: "success",
            message: "Lấy thông tin vé thành công",
            data: ticket
        })
    } catch (error) {
        next(error)
    }
}

const updateStatus = async (req, res, next) => {
    try {
        const ticket = await ticketService.updateStatus(req.params.id, req.body, "used")
        return res.status(201).json({
            status: "success",
            message: "Cập trạng thái nhật vé thành công",
            data: ticket
        })
    } catch (error) {
        next(error)
    }
}

const checkOut = async (req, res, next) => {
    try {
        const tickets = await ticketService.checkOut(req.body);
        res.status(201).json({
            status: "success",
            message: "Đặt vé thành công",
            data: tickets
        })
    } catch (error) {
        next(error)
    }
}

const staffCheckOut = async (req, res, next) => {
    try {
        const tickets = await ticketService.staffCheckOut(req.body);
        res.status(201).json({
            status: "success",
            message: "Đặt vé thành công",
            data: tickets
        })
    } catch (error) {
        next(error)
    }
}

const deleteHoldsSeats = async (req, res, next) => {
    try {
        const user = req.user;
        const ticket = await ticketService.deleteHoldsSeats(user, req.body.ticketId);
        res.status(201).json({
            status: "success",
            message: "Xóa vé thành công",
            data: ticket
        })
    } catch (error) {
        next(error)
    }
}

export const ticketController = {
    getAll,
    staffCreateTicket,
    create,
    getDetails,
    updateStatus,
    checkOut,
    staffCheckOut,
    deleteHoldsSeats,
    getOneByUser,
    getAllByUser
}