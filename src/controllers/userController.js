import { userService } from "@/services/userService";

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.status(200).json({
      status: "success",
      message: "Tìm danh sách người dùng thành công",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    // Điều hướng sang service
    const createdUser = await userService.create(req.body);
    // Có kết quả thì trả về phía Client
    res
      .status(200)
      .json({
        status: "success",
        message: "Thêm mới người dùng thành công",
        data: createdUser,
      });
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const userID = req.params.id;
    const user = await userService.getDetails(userID);
    res.status(200).json({
      status: "success",
      message: "Tìm người dùng thành công",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const dataUpdate = req.body;
    const reqImage = req.file;

    const user = await userService.updateUser(userId, dataUpdate, reqImage);
    res.status(200).json({
      status: "success",
      message: "Cập nhật người dùng thành công",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getDelete = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.getDelete(userId);
    res.status(200).json({
      status: "success",
      message: "Xóa người dùng thành công",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  getAll,
  create,
  getDetails,
  updateUser,
  getDelete,
};
