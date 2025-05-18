const moment = require('moment');
const vnpayConfig = require('../config/vnpayConfig');
import crypto from "crypto";


const createPaymentUrl = async (ticket) => {
    let ipAddr = "1.55.200.158";
    const moment = require("moment-timezone");
    let date = new Date();
    let createDate = moment.tz(date, "Asia/Ho_Chi_Minh").format("YYYYMMDDHHmmss");
    let expireDate = moment.tz(date, "Asia/Ho_Chi_Minh").add(15, "minutes").format("YYYYMMDDHHmmss");

    const tmnCode = vnpayConfig.vnp_TmnCode;
    const secretKey = vnpayConfig.vnp_HashSecret;
    const vnpUrl = vnpayConfig.vnp_Url;
    const returnUrl = vnpayConfig.vnp_ReturnUrl;

    let locale = "vn";
    let currCode = "VND";

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: ticket.code,
        vnp_OrderInfo: `Payment for ${123}`,
        vnp_OrderType: "other",
        vnp_Amount: ticket.totalAmount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
        vnp_BankCode: "NCB",
    };

    const sortedParams = sortParams(vnp_Params);

    const urlParams = new URLSearchParams();
    for (let [key, value] of Object.entries(sortedParams)) {
        urlParams.append(key, value);
    }

    const querystring = urlParams.toString();

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(querystring).digest("hex");

    urlParams.append("vnp_SecureHash", signed);

    const paymentUrl = `${vnpUrl}?${urlParams.toString()}`;

    return paymentUrl;
}

function sortParams(obj) {
    const sortedObj = Object.entries(obj)
        .filter(
            ([key, value]) => value !== "" && value !== undefined && value !== null
        )
        .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});

    return sortedObj;
}



export const paymentService = {
    createPaymentUrl,
}