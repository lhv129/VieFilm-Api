import { ticketService } from "../services/ticketService";



const getAll = async (req, res, next) => {
    try{
        const tickets = await ticketService.getAll();
        res.status(200).json({
            status:"success",
            message: "Lấy danh sách vé thành công",
            data: tickets
        })
    }catch (error){
        next(error)
    }
}

const staffCreateTicket = async (req, res, next) => {
    try{
        const user = req.user;
        const tickets = await ticketService.staffCreateTicket(user,req.body);
        res.status(201).json({
            status:"success",
            message: "Tạo vé thành công",
            data: tickets
        })
    }catch (error){
        next(error)
    }
}

const create = async (req, res, next) => {
    try{
        const user = req.user;
        const tickets = await ticketService.create(user,req.body);
        res.status(201).json({
            status:"success",
            message: "Đặt vé thành công",
            data: tickets
        })
    }catch (error){
        next(error)
    }
}

export const ticketController = {
    getAll,
    staffCreateTicket,
    create
}