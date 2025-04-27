import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { movieController } from "../../controllers/movieController";
import { movieValidation } from "../../validations/movieValidation";
import express from "express";
import multer from "multer";

const Router = express.Router();
const upload = multer(); // Khởi tạo multer

//Cho phép sử dụng form-data
Router.use(upload.single('poster'));

Router.route("/")
    .get(movieController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin'),movieValidation.createMovie,movieController.create)

Router.route("/:slug")
    .get(authenticateToken, roleMiddleware.checkRole('Admin'),movieController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin'),movieValidation.createMovie,movieController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin'),movieController.getDelete)

Router.route("/update-status-movie/:slug")
    .put(authenticateToken, roleMiddleware.checkRole('Admin'),movieController.updateStatus)

export const MovieRouter = Router;