import express from "express";
import { paymentMethodValidation } from "../../validations/paymentMethodValidation";
import { paymentMethodController } from "../../controllers/paymentMethodController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";


const Router = express.Router();
Router.use(authenticateToken, roleMiddleware.checkRole('Admin'));

Router.route("/")
    .get(paymentMethodController.getAll)
    .post(paymentMethodValidation.createPaymentMethod, paymentMethodController.create);
Router.route("/:slug")
    .get(paymentMethodController.getDetails)
    .put(paymentMethodValidation.createPaymentMethod, paymentMethodController.update)
    .delete(paymentMethodController.getDelete);

export const paymentMethodRouter = Router;
