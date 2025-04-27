
import { verifyAccessToken } from "@/utils/jwt";
import { userModel } from "@/models/userModel";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập bằng accessToken trước' });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await userModel.findOneById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = {authenticateToken};