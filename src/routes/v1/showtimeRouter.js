import express from "express";
import { showtimeController } from "../../controllers/showtimeController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { showtimeValidation } from "../../validations/showtimeValidation";

const Router = express.Router();

Router.route("/")
    .get(showtimeController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeValidation.createShowtime, showtimeController.create)

Router.route("/:id")
    .get(showtimeController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeController.getDelete)

Router.route("/get-seats-by-showtime")
    .post(showtimeController.getSeatsByShowtime)

Router.route("/get-all-by-movie")
    .post(showtimeController.getAllByMovie)

export const showtimeRouter = Router;
