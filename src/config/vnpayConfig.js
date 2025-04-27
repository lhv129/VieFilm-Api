import { env } from "../config/environment";


module.exports = {
  vnp_TmnCode: env.vnp_TmnCode, // Thay bằng mã website của bạn
  vnp_HashSecret: env.vnp_HashSecret, // Thay bằng chuỗi bí mật của bạn
  vnp_Url: env.vnp_Url, // Đường dẫn API VNPAY (sandbox hoặc production)
  vnp_ReturnUrl: env.vnp_ReturnUrl, // Đường dẫn trả về của bạn
  vnp_Api:"https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn',
  vnp_OrderInfoType: 'billpayment', // Loại thông tin đơn hàng
};