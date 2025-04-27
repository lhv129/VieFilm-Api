import { userModel } from "@/models/userModel";
import { roleModel } from "@/models/roleModel";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { convertDateToTimestamp } from "@/utils/convertDate";
import { ObjectId } from "mongodb";
const { uploadImage, deleteImage } = require("@/config/cloudinary");

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
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,"Tên và email đã tồn tại, vui lòng nhập lại");
    } else if (existingUsername) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,"Tên đã tồn tại, vui lòng nhập tên khác");
    } else if (existingUserEmail) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY,"Email đã tồn tại, vui lòng nhập tên khác");
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

const updateUser = async (userId, dataUpdate, reqImage) => {
  try {
    //Kiểm tra user đó có tồn tại không
    const user = await userModel.findOneById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }
    //Kiểm tra roleId đó có tồn tại hay không
    const role = await roleModel.findOneById(dataUpdate.roleId);
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ không tồn tại");
    }

    let imageUrl = user.images;
    let fileImage = user.fileImage;
    if (reqImage) {
      const deleteImageOld = await deleteImage("users", fileImage);

      const uploadResult = await uploadImage(reqImage, "users", 230, 230);
      imageUrl = uploadResult.url;
      fileImage = uploadResult.fileImage;
    }
    // Chuyển đổi dd/mm/yyyy sang timestamp
    const convertDate = convertDateToTimestamp(dataUpdate.birthday);
    const roleId = new ObjectId(dataUpdate.roleId);
    dataUpdate.roleId = roleId;
    dataUpdate.birthday = convertDate;

    const newUser = {
      ...dataUpdate,
      images: imageUrl,
      fileImage: fileImage,
      updatedAt: Date.now(),
    };
    await userModel.updatedUser(userId, newUser);

    const getNewUser = await userModel.getDetails(userId.toString());

    delete getNewUser.password; // Xóa trường password
    return getNewUser;
  } catch (error) {
    throw error;
  }
};

const getDelete = async (userId) => {
  try {
    const user = await userModel.getDelete(userId);
    if (user.modifiedCount === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Người dùng không tồn tại");
    }
    return [];
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
};
