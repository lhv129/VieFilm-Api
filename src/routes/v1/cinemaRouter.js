import express from "express";
import { cinemaValidation } from "../../validations/cinemaValidation";
import { cinemaController } from "../../controllers/cinemaController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import multer from "multer";

const Router = express.Router();
const upload = multer();

//Cho phép sử dụng form-data
Router.use(upload.single('images'));

Router.route("/")
    .get(cinemaController.getAll)
    .post(authenticateToken, roleMiddleware.checkRole('Admin'),cinemaValidation.createCinema, cinemaController.create);
Router.route("/:slug")
    .get(authenticateToken,cinemaController.getDetails)
    .put(authenticateToken, roleMiddleware.checkRole('Admin'),cinemaValidation.updateCinema, cinemaController.update)
    .delete(authenticateToken, roleMiddleware.checkRole('Admin'),cinemaController.getDelete);
Router.route("/get-all-by-province")
    .post(cinemaController.getAllByProvince);

export const cinemaRouter = Router;
