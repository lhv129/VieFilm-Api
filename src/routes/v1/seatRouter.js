import express from "express";
import { seatController } from "../../controllers/seatController";
import { seatValidation } from "../../validations/seatValidation";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { authenticateToken } from "../../middlewares/authMiddleware";

const Router = express.Router();

Router.route("/")
    .get(seatController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'),seatValidation.createSeat, seatController.createSeats)

Router.route("/:id")
    .get(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'),seatController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'),seatValidation.updateSeat, seatController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'),seatController.getDelete)

Router.route("/get-all-by-screen")
    .post(seatController.getAllByScreen)

export const seatRouter = Router;