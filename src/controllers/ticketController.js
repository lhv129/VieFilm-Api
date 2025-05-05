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

const create = async (req, res, next) => {
    try {
        const user = req.user;
        const tickets = await ticketService.create(user, req.body);
        res.status(201).json({
            status: "success",
            message: "Giữ ghế thành công",
            data: tickets
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
        const ticket = await ticketService.updateStatus(req.params.id, "used")
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

const deleteHoldsSeats = async (req, res, next) => {
    try {
        const user = req.user;
        const ticket = await ticketService.deleteHoldsSeats(user,req.body.ticketId);
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
    deleteHoldsSeats
}