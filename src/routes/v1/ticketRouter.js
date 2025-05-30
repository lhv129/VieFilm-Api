import { ticketController } from "../../controllers/ticketController";
import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import multer from "multer";
import { ticketValidation } from "../../validations/ticketValidation";
import { paymentController } from "../../controllers/paymentController";

const Router = express.Router();
const upload = multer(); // Khởi tạo multer
Router.use(upload.single('images'));



Router.route('/get-all')
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), ticketController.getAll)

Router.route('/get-all-by-user')
    .post(authenticateToken, ticketController.getAllByUser);

Router.route('/get-one-by-user')
    .post(authenticateToken, ticketController.getOneByUser);

Router.route('/hold/seats')
    .post(authenticateToken, ticketValidation.create, ticketController.create)
    .delete(authenticateToken, ticketController.deleteHoldsSeats)

Router.route('/checkout')
    .post(authenticateToken, ticketController.checkOut);

Router.route('/vnpay-return').get(paymentController.handlePaymentReturn);

//Router nhân viên tạo vé tại quầy
Router.route('/staff/create')
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), ticketValidation.staffCreateTicket, ticketController.staffCreateTicket)
Router.route('/staff/checkout')
    .post(authenticateToken, ticketController.staffCheckOut);

Router.route('/get-one')
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), ticketController.getDetails)

Router.route('/update/status')
    .put(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), ticketController.updateStatus)


export const ticketRouter = Router;