import { roleModel } from "@/models/roleModel";
import { roleService } from "@/services/roleService";

const getAll = async (req, res, next) => {
  try {
    const roles = await roleService.getAll();
    res.status(200).json({
      status: "success",
      message: "Tìm danh sách chức vụ thành công",
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    // Điều hướng sang service
    const createdRole = await roleService.create(req.body);
    // Có kết quả thì trả về phía Client
    res.status(201).json({
      status: "success",
      message: "Tạo thành công chức vụ",
      data: createdRole,
    });
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const role = await roleService.getDetails(slug);
    res.status(200).json({
      status: "success",
      message: "Tìm thành công chức vụ",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const dataUpdate = req.body;
    const role = await roleService.updateRole(slug, dataUpdate);
    res.status(200).json({
      status: "success",
      message: "Cập nhật chức vụ thành công",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

const getDelete = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const role = await roleService.getDelete(slug);
    res.status(200).json({
      status: "success",
      message: "Xóa chức vụ thành công",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const roleController = {
  getAll,
  create,
  getDetails,
  updateRole,
  getDelete,
};
