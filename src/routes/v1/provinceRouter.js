import express from "express";
import { provinceValidation } from "../../validations/provinceValidation";
import { provinceController } from "../../controllers/provinceController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";


const Router = express.Router();

Router.route("/")
    .get(provinceController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin'),provinceValidation.createProvince, provinceController.create);
Router.route("/:slug")
    .get(authenticateToken, roleMiddleware.checkRole('Admin'),provinceController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin'),provinceValidation.createProvince, provinceController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin'),provinceController.getDelete);

export const provinceRouter = Router;
