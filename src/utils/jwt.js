import { env } from "@/config/environment";
import { userModel } from "@/models/userModel";
import jwt from "jsonwebtoken";

const refreshTokenSecret = env.ACCESS_TOKEN_SECRET;
const refreshTokenLife = env.REFRESH_TOKEN_LIFE;
const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
const accessTokenLife = env.ACCESS_TOKEN_LIFE;
const refreshTokenExpired = env.REFRESH_TOKEN_EXPIRED;

const ms = require('ms');

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, accessTokenSecret, {
        expiresIn: accessTokenLife,
    });
};

const generateRefreshToken = async (user) => {
    let refreshToken = "";

    if (!user.refresh_token) {
        const expiredRefreshToken = Date.now() + (refreshTokenExpired * 1000);
        refreshToken = jwt.sign({ id: user._id }, refreshTokenSecret, {
            expiresIn: refreshTokenLife,
        });
        await userModel.updateRefreshToken(user._id, refreshToken, expiredRefreshToken);
    } else {
        if (user.expired_refresh_token < Date.now()) {
            const expiredRefreshToken = Date.now() + (refreshTokenExpired * 1000);
            refreshToken = jwt.sign({ id: user._id }, refreshTokenSecret, {
                expiresIn: refreshTokenLife,
            });
            await userModel.updateRefreshToken(user._id, refreshToken, expiredRefreshToken);
        } else {
            refreshToken = user.refresh_token;
        }
    }
    return refreshToken;

};

const verifyAccessToken = (token) => {
    return jwt.verify(token, accessTokenSecret);
};


module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };


