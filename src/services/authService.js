import { userModel } from "../models/userModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { roleModel } from "../models/roleModel";
import { env } from "../config/environment";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from "../utils/email";

const login = async (reqBody) => {
    try {
        const user = await userModel.findOne({ email: reqBody.email });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Email không tồn tại");
        }

        const bcrypt = require("bcrypt");
        const isPasswordValid = bcrypt.compareSync(reqBody.password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Mật khẩu không chính xác");
        }

        if (user.status === 'inactive') {
            throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản của bạn chưa kích hoạt, vui lòng kiểm tra lại email để kích hoạt tài khoản");
        }
        if (user.status === 'block') {
            throw new ApiError(StatusCodes.FORBIDDEN, "Tài khoản của bạn đã bị khóa, vui lòng liên hệ tới admin");
        }

        // Tạo Access Token và Refresh Token
        const accessToken = generateAccessToken(user);
        let refreshToken = await generateRefreshToken(user);
        const newUser = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: user
        }
        return newUser;
    } catch (error) {
        throw error;
    }
};

const register = async (reqBody) => {
    try {
        // Lấy ra id của role member
        const memberRoleId = await roleModel.findOne({ name: "Member" });

        // Loại bỏ password_confirm
        delete reqBody.password_confirm;
        const bcrypt = require("bcrypt");
        // Hash password
        const saltRounds = 1;
        const hashedPassword = bcrypt.hashSync(reqBody.password, saltRounds);
        reqBody.password = hashedPassword;

        // Tạo token xác thực email
        const verificationToken = uuidv4();
        const newUser = {
            ...reqBody,
            roleId: memberRoleId._id.toString(),
            images:"https://res.cloudinary.com/dewhibspm/image/upload/v1745010004/default_twvy3l.jpg",
            email_verification_token: verificationToken
        };

        //Kiểm tra username và email đã tồn tại chưa
        const existingUsername = await userModel.findOne({
            username: newUser.username,
        });
        const existingUserEmail = await userModel.findOne({
            email: newUser.email,
        });
        if (existingUsername && existingUserEmail) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên và email đã tồn tại, vui lòng nhập lại");
        } else if (existingUsername) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên đã tồn tại, vui lòng nhập tên khác");
        } else if (existingUserEmail) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Email đã tồn tại, vui lòng nhập email khác");
        }

        // Nếu chưa tồn tại thì thêm mới
        const createdUser = await userModel.create(newUser);
        // Lấy ra bản ghi sau khi thêm
        const getNewUser = await userModel.findOneById(
            createdUser.insertedId.toString()
        );

        // Xây dựng liên kết xác thực
        const verificationLink = `${env.CLIENT_URL}/verify-email/${verificationToken}`;

        // Nội dung email
        const subject = 'Vui lòng xác thực địa chỉ email của bạn';
        const body = `Chào ${newUser.username},<br><br>Vui lòng nhấp vào liên kết sau để xác thực địa chỉ email của bạn:<br><a href="${verificationLink}">${verificationLink}</a><br><br>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.<br><br>Trân trọng,<br>Đội ngũ của bạn.`;

        // Gửi email xác thực
        await sendEmail(newUser.email, subject, body);

        return getNewUser;
    } catch (error) {
        throw error;
    }
}

const verificationEmail = async (token) => {
    let user = await userModel.findOne({email_verification_token:token});
    if(!user){
        throw new ApiError(StatusCodes.NOT_FOUND, "Token không hợp lệ");
    }
    user = {
        ...user,
        email_verification_token:null,
        status: 'active',
        email_verified_at: Date.now()
    }

    await userModel.updatedUser(user._id,user);

    // Tạo Access Token và Refresh Token
    const accessToken = generateAccessToken(user);
    let refreshToken = await generateRefreshToken(user);
    const newUser = {
        status: "success",
        message: "Xác thực email thành công",
        access_token: accessToken,
        refresh_token: refreshToken,
        user: user
    }
    return newUser;
}

const refreshToken = async (reqBody) => {
    try {
        const user = await userModel.findOne({ refresh_token: reqBody.refresh_token });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Token không hợp lệ hoặc đã hết hạn");
        }
        const accessToken = generateAccessToken(user);

        const newUser = {
            access_token: accessToken,
            refresh_token: user.refresh_token,
            user: user
        }
        return newUser;
    } catch (error) {
        throw error;
    }
}

export const authService = {
    login,
    register,
    refreshToken,
    verificationEmail
}