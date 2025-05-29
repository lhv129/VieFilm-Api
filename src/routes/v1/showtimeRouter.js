import express from "express";
import { showtimeController } from "../../controllers/showtimeController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { showtimeValidation } from "../../validations/showtimeValidation";

const Router = express.Router();

Router.route("/get-all")
    .post(showtimeController.getAll)

Router.route("/")
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeValidation.createShowtime, showtimeController.create)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeController.getDelete)

Router.route("/:id")
    .get(showtimeController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), showtimeController.update)

Router.route("/get-seats-by-showtime")
    .post(showtimeController.getSeatsByShowtime)

Router.route("/get-all-by-movie")
    .post(showtimeController.getAllByMovie)

Router.route("/get-all-by-date")
    .post(showtimeController.getAllShowtimeByCinemaHandler);

Router.route("/get-all-by-screen")
    .post(showtimeController.getAllByScreen);
Router.route("/get-empty-showtime")
    .post(showtimeController.getEmptyShowtime);

export const showtimeRouter = Router;
