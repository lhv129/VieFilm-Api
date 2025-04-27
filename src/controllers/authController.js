import { authService } from "../services/authService";

const login = async (req, res, next) => {
    try {
        const user = await authService.login(req.body);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

const getUserInfo = async (req, res, next) => {
    res.status(200).json({ status: "success", message: "Tìm thành công thông tin người dùng", user: req.user });
}

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        if (user) {
            res.status(200).json({ status: "success", message: "Vui lòng kiểm tra email để kích hoạt tài khoản" })
        }
    } catch (error) {
        next(error);
    }
}

const verificationEmail = async (req, res, next) => {
    try {
        const user = await authService.verificationEmail(req.params.token);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const user = await authService.refreshToken(req.body);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export const authController = {
    login,
    getUserInfo,
    register,
    refreshToken,
    verificationEmail
}