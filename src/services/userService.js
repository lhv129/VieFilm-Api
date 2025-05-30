import { userModel } from "../models/userModel";
import { roleModel } from "../models/roleModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { convertDateToTimestamp } from "../utils/convertDate";
import { ObjectId } from "mongodb";
import { cinemaModel } from "../models/cinemaModel";
const { uploadImage, deleteImage } = require("../config/cloudinary");

const getAll = async () => {
  try {
    const roles = await userModel.getAll();
    return roles;
  } catch (error) {
    throw error;
  }
};

const create = async (reqBody) => {
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

    const newUser = {
      ...reqBody,
      roleId: memberRoleId._id.toString(),
      images:
        "https://res.cloudinary.com/dewhibspm/image/upload/v1745010004/default_twvy3l.jpg",
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
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Email đã tồn tại, vui lòng nhập tên khác");
    }

    // Nếu chưa tồn tại thì thêm mới
    const createdUser = await userModel.create(newUser);
    // Lấy ra bản ghi sau khi thêm
    const getNewUser = await userModel.findOneById(
      createdUser.insertedId.toString()
    );

    return getNewUser;
  } catch (error) {
    throw error;
  }
};

const getDetails = async (userId) => {
  try {
    const user = await userModel.getDetails(userId);
    if (Object.keys(user).length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }

    delete user.password;
    return user;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (reqBody) => {
  try {

    const { userId, roleId, cinemaId } = reqBody;

    //Kiểm tra user đó có tồn tại không
    const user = await userModel.findOneById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }
    //Kiểm tra roleId đó có tồn tại hay không
    const role = await roleModel.findOneById(roleId);
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ không tồn tại");
    }
    const cinema = await cinemaModel.findOneById(cinemaId);
    if (!cinema) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Rạp không tồn tại");
    }

    const newUser = {
      roleId: new ObjectId(roleId),
      cinemaId: new ObjectId(cinemaId),
      updatedAt: Date.now()
    }
    await userModel.updatedUser(userId, newUser);

    const getNewUser = await userModel.getDetails(userId.toString());

    delete getNewUser.password; // Xóa trường password
    return getNewUser;
  } catch (error) {
    throw error;
  }
};

const getDelete = async (user, reqBody) => {
  try {

    const { userId } = reqBody;

    if (user._id.toString() === userId) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Bạn không thể xóa tài khoản chính mình");
    }

    const userData = await userModel.getDelete(userId);
    if (userData.modifiedCount === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }
    return [];
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (user, reqBody) => {
  try {
    const { userId, status } = reqBody;

    const userData = await userModel.findOneById(userId);
    if (!userData) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }

    if (user._id.toString() === userId) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Bạn không thể thay đổi trạng thái tài khoản của chính mình");
    }

    if (status === 'active' || status === 'block') {
      const data = {
        status: status,
        updatedAt: Date.now(),
      }
      await userModel.updatedUser(userId, data);
      return;
    } else {
      throw new ApiError(StatusCodes.NOT_FOUND, "Trạng thái tài khoản chỉ có active hoặc block");
    }

  } catch (error) {
    throw error;
  }
};

const removeRole = async (user, reqBody) => {
  try {
    const { userId } = reqBody;

    const userData = await userModel.findOneById(userId);
    if (!userData) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }

    const role = await roleModel.findOne({ name: "Member" });
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ khách hàng không tồn tại, vui lòng kiểm tra lại");
    }

    if (user._id.toString() === userId) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Bạn không thể thay đổi chức vụ của chính mình");
    }

    await userModel.updateOne(userId, {
      roleId: new ObjectId(role._id)
    });

    await userModel.removeRole(userId);

    return;
  } catch (error) {
    throw error;
  }
};

export const userService = {
  getAll,
  create,
  getDetails,
  updateUser,
  getDelete,
  updateStatus,
  removeRole
};
