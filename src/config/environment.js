import 'dotenv/config';

export const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME: process.env.DATABASE_NAME,
    APP_HOST: process.env.APP_HOST,
    APP_PORT: process.env.APP_PORT,
    PORT: process.env.PORT,
    APP: process.env.APP,
    CLIENT_URL:process.env.CLIENT_URL,


    CLOUD_NAME: process.env.CLOUD_NAME,
    API_KEY: process.env.API_KEY,
    API_SECRET: process.env.API_SECRET,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE,
    REFRESH_TOKEN_EXPIRED: process.env.REFRESH_TOKEN_EXPIRED,

    EMAIL_SERVICE:process.env.EMAIL_SERVICE,
    EMAIL_USERNAME:process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD:process.env.EMAIL_PASSWORD,

    // Tích hợp thanh toán online
    vnp_TmnCode : process.env.vnp_TmnCode,
    vnp_HashSecret : process.env.vnp_HashSecret,
    vnp_Url: process.env.vnp_Url,
    vnp_ReturnUrl: process.env.vnp_ReturnUrl,
    vnp_ApiVersion: process.env.vnp_ApiVersion,
}