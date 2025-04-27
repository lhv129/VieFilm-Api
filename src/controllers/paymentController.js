import { ticketModel } from "../models/ticketModel";

const handlePaymentReturn = async (req, res) => {
    const { vnp_ResponseCode, vnp_TxnRef } = req.query;
    try {
        if (!vnp_ResponseCode || !vnp_TxnRef) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const ticket = await ticketModel.findOne({ code: vnp_TxnRef });
        if (!ticket) {
            return res.status(401).json({
                success: false,
                message: "TicketId không tồn tại",
            });
        }
        if (vnp_ResponseCode !== "00") {
            await ticketModel.getDelete(ticket._id);
            return res.status(400).json({
                status: false,
                message: "Thanh toán thất bại"
            })
        } else {
            await ticketModel.updateStatus(ticket._id.toString(),"paid");
            const getTicket = await ticketModel.getDetails(ticket._id.toString());

            // console.log(getTicket);

            res.status(400).json({
                status: true,
                message: "Đặt vé thành công",
                data: getTicket
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error server",
        });
    }
}



export const paymentController = {
    handlePaymentReturn
};