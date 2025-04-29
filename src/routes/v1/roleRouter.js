import express from "express";
import { roleValidation } from "../../validations/roleValidation";
import { roleController } from "../../controllers/roleController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const Router = express.Router();

Router.route("/")
  .get(authenticateToken, roleMiddleware.checkRole('Admin'), roleController.getAll)
  .post(authenticateToken, roleMiddleware.checkRole('Admin'), roleValidation.createRole, roleController.create);
Router.route("/:slug")
  .get(authenticateToken, roleMiddleware.checkRole('Admin'), roleController.getDetails)
  .put(authenticateToken, roleMiddleware.checkRole('Admin'), roleValidation.createRole, roleController.updateRole)
  .delete(authenticateToken, roleMiddleware.checkRole('Admin'), roleController.getDelete);

Router.route("/get-one/:id")
  .get(roleController.getOne)

export const roleRouter = Router;
