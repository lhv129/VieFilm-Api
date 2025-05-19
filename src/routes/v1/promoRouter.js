// promoRouter.js
import express from "express";
import { promoController } from "../../controllers/promoController";
import { promoValidation } from "../../validations/promoValidation";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const Router = express.Router();

Router.route("/")
  .get( promoController.getAll)
  .post(authenticateToken, roleMiddleware.checkRole("Admin"), promoValidation.createPromo, promoController.create);

Router.route("/:id")
  .get(promoController.getDetails)
  .put(authenticateToken, roleMiddleware.checkRole("Admin"), promoValidation.createPromo, promoController.updatePromo)
  .delete(authenticateToken, roleMiddleware.checkRole("Admin"), promoController.deletePromo);

Router.route("/get-one-by-name")
  .post(authenticateToken,promoController.getOneByName)
export const promoRouter = Router;