import { userModel } from "../models/userModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { roleModel } from "../models/roleModel";
import { env } from "../config/environment";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from "../utils/email";
import { convertDateToTimestamp } from "../utils/convertDate";
import { normalizeVietnamPhone } from "../utils/normalizeVietnamPhone";
import { passwordResetModel } from "../models/passwordResetModel";
import crypto from "crypto";
const { uploadImage, deleteImage } = require("../config/cloudinary");
const bcrypt = require("bcrypt");

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

        //Trả lại roleName
        const role = await roleModel.findOne({ _id: user.roleId });

        // Tạo Access Token và Refresh Token
        const accessToken = generateAccessToken(user);
        let refreshToken = await generateRefreshToken(user);

        delete user.password;
        delete user.refresh_token;

        const newUser = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                ...user,
                roleName: role?.name
            }
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
            images: "https://res.cloudinary.com/dewhibspm/image/upload/v1745010004/default_twvy3l.jpg",
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
    let user = await userModel.findOne({ email_verification_token: token });
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Token không hợp lệ");
    }
    user = {
        ...user,
        email_verification_token: null,
        status: 'active',
        email_verified_at: Date.now()
    }

    await userModel.updatedUser(user._id, user);

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

const updateProfile = async (user, reqBody, reqImage) => {
    try {
        const { username, fullname, phone, address, birthday } = reqBody;

        const normalizedPhone = normalizeVietnamPhone(phone);
        // Chuyển đổi dd/mm/yyyy sang timestamp
        const convertDate = convertDateToTimestamp(birthday);

        const existingUser = await userModel.findOne({
            username: username,
            _id: { $ne: user._id },
        });
        if (existingUser) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Username đã tồn tại");
        }

        const existingPhone = await userModel.findOne({
            phone: normalizedPhone,
            _id: { $ne: user._id },
        });
        if (existingPhone) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }

        let imageUrl = user.images;
        let fileImage = user.fileImage;
        if (reqImage) {
            const deleteImageOld = await deleteImage("users", fileImage);
            const uploadResult = await uploadImage(reqImage, "users", 230, 230);
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }

        const newUser = {
            username,
            fullname,
            phone: normalizedPhone,
            address,
            birthday: convertDate,
            images: imageUrl,
            fileImage: fileImage,
            updatedAt: Date.now(),
        }
        await userModel.updateOne(user._id.toString(), newUser);

    } catch (error) {
        throw error;
    }
}

const changePassword = async (user, reqBody) => {
    try {
        const { password, newPassword, confirmPassword } = reqBody;
        // 1. Lấy thông tin người dùng
        const userData = await userModel.findOne({ _id: user._id });
        if (!userData) throw new Error("Người dùng không tồn tại");

        // 2. Kiểm tra mật khẩu cũ có đúng không
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) throw new Error("Mật khẩu cũ không đúng");

        // 3. Kiểm tra newPassword và confirmPassword
        if (newPassword !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");

        // 4. Mã hóa mật khẩu mới
        // Hash password
        const saltRounds = 1;
        const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);

        // 5. Cập nhật mật khẩu trong DB
        await userModel.updateOne(user._id.toString(), { password: hashedPassword });

    } catch (error) {
        throw error;
    }
};

const sendTokenForgetPassword = async (reqBody) => {
    try {
        const { email } = reqBody;

        // Tìm bản ghi token theo email
        const existingToken = await passwordResetModel.findOne({ email });

        // Nếu đã có token
        if (existingToken) {
            // Kiểm tra token còn sống không
            if (existingToken.expires_at > Date.now()) {
                // Token còn hạn -> không tạo mới
                return null;
            } else {
                // Token hết hạn -> xóa token cũ
                await passwordResetModel.deleteByEmail(email);
            }
        }

        // Tạo token mới
        const token = crypto.randomBytes(5).toString("hex");
        const expires_at = Date.now() + 10 * 60 * 1000; // 10 phút

        await passwordResetModel.create({
            email,
            token,
            expires_at,
            created_at: Date.now(),
            updated_at: Date.now()
        });

        const subject = "Yêu cầu đặt lại mật khẩu của bạn";

        const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Chào bạn,</p>

            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại website VieFilm</p>

            <p><strong>Mã xác nhận của bạn là:</strong></p>

            <div style="font-size: 24px; font-weight: bold; background-color: #f2f2f2; padding: 10px 15px; display: inline-block; border-radius: 4px; border: 1px solid #ddd;">
            ${token}
            </div>

            <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>

            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

            <p>Trân trọng,<br>Đội ngũ hỗ trợ của chúng tôi</p>
        </div>
        `;

        await sendEmail(email, subject, body);
    } catch (error) {
        throw error;
    }
};

const forgetPassword = async (reqBody) => {
    try {
        const { token, password, confirmPassword } = reqBody;

        // 1. Kiểm tra xác nhận mật khẩu
        if (password !== confirmPassword) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Mật khẩu xác nhận không khớp");
        }

        // 2. Tìm token trong bảng password_resets
        const resetRecord = await passwordResetModel.findOne({ token });

        if (!resetRecord) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Token không tồn tại hoặc không hợp lệ.");
        }

        // 3. Kiểm tra token còn hạn
        if (resetRecord.expires_at < Date.now()) {
            // Token hết hạn
            await passwordResetModel.deleteOne({ token });
            throw new ApiError(StatusCodes.NOT_FOUND, "Token đã hết hạn.");
        }

        // 4. Tìm user theo email
        const user = await userModel.findOne({ email: resetRecord.email });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại.");
        }

        // 5. Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Cập nhật mật khẩu mới vào users
        await userModel.updateOne(user._id, {
            password: hashedPassword,
            updatedAt: Date.now()
        });

        // 7. Xóa token sau khi đổi mật khẩu thành công
        await passwordResetModel.deleteOne({ token });

        //Trả lại roleName
        const role = await roleModel.findOne({ _id: user.roleId });
        // Tạo Access Token và Refresh Token
        const accessToken = generateAccessToken(user);
        let refreshToken = await generateRefreshToken(user);

        delete user.password;
        delete user.refresh_token;

        const newUser = {
            status: "success",
            message: "Thay đổi mật khẩu thành công",
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                ...user,
                roleName: role?.name
            }
        }
        return newUser;
    } catch (error) {
        throw error;
    }
};


export const authService = {
    login,
    register,
    refreshToken,
    verificationEmail,
    updateProfile,
    changePassword,
    sendTokenForgetPassword,
    forgetPassword
}