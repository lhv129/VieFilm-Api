import express from "express";
import { productValidation } from "../../validations/productValidation";
import { productController } from "../../controllers/productController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import multer from "multer";

const Router = express.Router();
const upload = multer();

//Cho phép sử dụng form-data
Router.use(upload.single('images'));

Router.route("/")
    .get(productController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin','Staff'),productValidation.createProduct, productController.create);
Router.route("/:slug")
    .get(productController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin','Staff'),productValidation.createProduct, productController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin','Staff'),productController.getDelete);

Router.route("/update/status")
    .put(authenticateToken, roleMiddleware.checkRole('Admin'), productController.updateStatus);

export const productRouter = Router;
