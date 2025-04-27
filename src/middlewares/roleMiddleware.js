import { roleModel } from "@/models/roleModel";

const checkRole = (...roles) => {
    return async (req, res, next) => {
        const userRole = await roleModel.findOneById(req.user.roleId);
        if (!req.user || !req.user.roleId) {
            return res.status(401).json({ status:"false",message: 'Không tìm thấy thông tin người dùng hoặc vai trò'});
        }

        if (roles.includes(userRole.name)) {
            return next(); // Vai trò được phép, chuyển đến handler tiếp theo
        } else {
            return res.status(403).json({ status:"false",message: 'Bạn không có quyền truy cập vào tài nguyên này'});
        }
    };
};

export const roleMiddleware = {
    checkRole
}