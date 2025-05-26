import express from "express";
import { authController } from "../../controllers/authController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { authValidation } from "../../validations/authValidation";
import multer from "multer";

const Router = express.Router();
const upload = multer();
//Cho phép sử dụng form-data
Router.use(upload.single('images'));

Router.route("/login").post(authValidation.loginValidation, authController.login)
Router.route("/register").post(authValidation.registerValidation, authController.register);

Router.route("/profile")
    .get(authenticateToken, authController.getUserInfo)
    .post(authenticateToken,authValidation.updateProfile ,authController.updateProfile);

Router.route("/change-password")
    .post(authenticateToken,authValidation.changePassword,authController.changePassword);

Router.route("/send-token-forget-password")
    .post(authController.sendTokenForgetPassword)

Router.route("/forget-password")
    .put(authController.forgetPassword)

Router.route("/refresh-token").post(authController.refreshToken);
Router.route("/verify-email/:token").get(authController.verificationEmail)


export const authRouter = Router;