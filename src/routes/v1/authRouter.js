import express from "express";
import { authController } from "../../controllers/authController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { authValidation } from "../../validations/authValidation";

const Router = express.Router();

Router.route("/login").post(authValidation.loginValidation,authController.login)
Router.route("/register").post(authValidation.registerValidation,authController.register);
Router.route("/profile").get(authenticateToken,authController.getUserInfo);
Router.route("/refresh-token").post(authController.refreshToken);
Router.route("/verify-email/:token").get(authController.verificationEmail)


export const authRouter = Router;