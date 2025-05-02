import express from "express";
import { screenValidation } from "../../validations/screenValidation";
import { screenController } from "../../controllers/screenController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";


const Router = express.Router();

Router.route("/")
    .get(screenController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), screenValidation.createScreen, screenController.create)
    .put(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), screenValidation.updateScreen, screenController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), screenController.getDelete);
Router.route("/:id")
    .get(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), screenController.getDetails)

Router.route("/:get-one")
    .post(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'), screenController.getOne)

Router.route("/get-all-by-cinema")
    .post(screenController.getAllByCinema)

export const screenRouter = Router;
