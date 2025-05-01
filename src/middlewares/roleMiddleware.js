import { roleModel } from "../models/roleModel";

const checkRole = (...roles) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.roleId) {
            return res.status(401).json({ status: "false", message: "Không tìm thấy thông tin người dùng hoặc vai trò" });
        }

        const userRole = await roleModel.findOneById(req.user.roleId);
        if (!userRole || !roles.includes(userRole.name)) {
            return res.status(403).json({ status: "false", message: "Bạn không có quyền truy cập vào tài nguyên này" });
        }

        // Nếu là staff hoặc manager => cần kiểm tra cinemaId
        if (["Staff", "Manager"].includes(userRole.name)) {
            const requestedCinemaId = req.params.cinemaId || req.body.cinemaId || req.query.cinemaId;

            // console.log(req.user);

            // console.log(requestedCinemaId);

            if (!requestedCinemaId) {
                return res.status(400).json({ status: "false", message: "Thiếu thông tin cinemaId trong request" });
            }

            // So sánh dưới dạng string để tránh mismatch ObjectId
            if (requestedCinemaId !== req.user.cinemaId.toString()) {
                return res.status(403).json({ status: "false", message: "Bạn không được phép thao tác với rạp này" });
            }
        }

        next();
    };
};

export const roleMiddleware = {
    checkRole
};