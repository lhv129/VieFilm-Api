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

Router.route("/get-all-by-date")
    .post(movieController.getAllByDate)

Router.route("/")
    .get(movieController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin'), movieValidation.createMovie, movieController.create)

Router.route("/:slug")
    .get(movieController.getOne)
    .put(authenticateToken, roleMiddleware.checkRole('Admin'), movieValidation.updateMovie, movieController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin'), movieController.getDelete)

Router.route("/:slug/details")
    .get(movieController.getDetails)

Router.route("/update-status-movie")
    .post(authenticateToken, roleMiddleware.checkRole('Admin'), movieController.updateStatus)

Router.route("/get-one-by-id/:id")
    .get(movieController.getOneById)

export const MovieRouter = Router;