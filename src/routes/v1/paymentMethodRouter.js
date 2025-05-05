import express from "express";
import { paymentMethodValidation } from "../../validations/paymentMethodValidation";
import { paymentMethodController } from "../../controllers/paymentMethodController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";


const Router = express.Router();

Router.route("/")
    .get(paymentMethodController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin'),paymentMethodValidation.createPaymentMethod, paymentMethodController.create);
Router.route("/:slug")
    .get(paymentMethodController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin'),paymentMethodValidation.createPaymentMethod, paymentMethodController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin'),paymentMethodController.getDelete);

export const paymentMethodRouter = Router;
