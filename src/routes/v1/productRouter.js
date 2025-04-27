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
Router.use(authenticateToken, roleMiddleware.checkRole('Admin'));

Router.route("/")
    .get(productController.getAll)
    .post(productValidation.createProduct, productController.create);
Router.route("/:slug")
    .get(productController.getDetails)
    .put(productValidation.createProduct, productController.update)
    .delete(productController.getDelete);

export const productRouter = Router;
