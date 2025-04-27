import express from "express";
import { userValidation } from "../../validations/userValidation";
import { userController } from "../../controllers/userController";
import multer from "multer";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const Router = express.Router();
const upload = multer(); // Khởi tạo multer

//Cho phép sử dụng form-data
Router.use(upload.single('images'));
Router.use(authenticateToken,roleMiddleware.checkRole('Admin'));

Router.route("/")
  .get(userController.getAll)
  .post(userValidation.createUser, userController.create);

Router.route("/:id")
  .get(userController.getDetails)
  .put(userValidation.updateUser, userController.updateUser)
  .delete(userController.getDelete);

export const userRouter = Router;
