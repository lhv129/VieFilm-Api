import { slugify } from "@/utils/formatters";
import { roleModel } from "@/models/roleModel";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getAll = async () => {
  try {
    const roles = await roleModel.getAll();
    return roles;
  } catch (error) {
    throw error;
  }
};

const create = async (reqBody) => {
  try {
    //Xử lý luôn slug
    const newRole = {
      ...reqBody,
      slug: slugify(reqBody.name),
    };
    // Kiểm tra xem name đã tồn tại chưa
    const existingRole = await roleModel.findOne({ name: newRole.name });
    if (existingRole) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên chức vụ đã có, vui lòng chọn tên khác");
    }

    // Nếu chưa tồn tại thì thêm mới
    const createdRole = await roleModel.create(newRole);
    //Lấy bản ghi sau khi thêm
    const getNewRole = await roleModel.findOneById(
      createdRole.insertedId.toString()
    );

    return getNewRole;
  } catch (error) {
    throw error;
  }
};

const getDetails = async (slug) => {
  try {
    const role = await roleModel.findOne({ slug: slug });
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ không tồn tại");
    }
    return role;
  } catch (error) {
    throw error;
  }
};

const updateRole = async (slug, dataUpdate) => {
  try {
    //Kiểm tra xem role đó có tồn tại không
    const role = await roleModel.findOne({ slug: slug });
    if (!role) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ không tồn tại");
    }
    // Nếu có tồn tại thì cập nhật
    const newRole = {
      ...dataUpdate,
      slug: slugify(dataUpdate.name),
      updatedAt: Date.now()
    };

    // Cập nhật
    const updatedRole = await roleModel.updateRole(role._id, newRole);

    //Lấy bản ghi sau khi cập nhật
    const getNewRole = await roleModel.findOneById(role._id.toString());

    return getNewRole;

  } catch (error) {
    throw error;
  }
};

const getDelete = async (slug) => {
  try {
    const role = await roleModel.getDelete(slug);
    if (role.deletedCount === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Chức vụ không tồn tại");
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export const roleService = {
  getAll,
  create,
  getDetails,
  updateRole,
  getDelete,
};
