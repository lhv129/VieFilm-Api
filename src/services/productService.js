import { productModel } from "../models/productModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { slugify } from "../utils/formatters";
const { uploadImage, deleteImage } = require("../config/cloudinary");

const getAll = async () => {
    try {
        const products = await productModel.getAll();
        return products;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody,reqImage) => {
    try {
        // Kiểm tra xem name đã tồn tại chưa
        const existingProduct = await productModel.findOne({ name: reqBody.name });
        if (existingProduct) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, "Tên combo đã có, vui lòng chọn tên khác");
        }

        //Thêm ảnh
        let imageUrl = "";
        let fileImage = "";
        if (reqImage) {
            const uploadResult = await uploadImage(reqImage, "products");
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }

        //Xử lý luôn slug
        const data = {
            ...reqBody,
            images: imageUrl,
            fileImage: fileImage,
            slug: slugify(reqBody.name),
        };

        // Nếu chưa tồn tại thì thêm mới
        const product = await productModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getProduct = await productModel.findOneById(
            product.insertedId.toString()
        );

        return getProduct;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (slug) => {
    try {
        const product = await productModel.findOne({slug:slug});
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Combo không tồn tại");
        }
        return product;
    } catch (error) {
        throw error;
    }
};

const update = async (slug, data, reqImage) => {
    try {
        const product = await productModel.findOne({ slug: slug });
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Combo không tồn tại");
        }
        // Nếu thay đổi ảnh thì cập nhật
        let imageUrl = product.images;
        let fileImage = product.fileImage;
        if (reqImage) {
            await deleteImage("products", fileImage);
            const uploadResult = await uploadImage(reqImage, "products", 500, 400);
            imageUrl = uploadResult.url;
            fileImage = uploadResult.fileImage;
        }
        // Nếu có tồn tại thì cập nhật
        let newProduct = {
            ...data,
            images: imageUrl,
            fileImage: fileImage,
            slug: slugify(data.name),
            updatedAt: Date.now()
        };

        // Cập nhật
        newProduct = await productModel.update(product._id, newProduct);

        //Lấy bản ghi sau khi cập nhật
        const getNewProduct = await productModel.findOneById(product._id.toString());

        return getNewProduct;

    } catch (error) {
        throw error;
    }
};

const getDelete = async (slug) => {
    try {
        const product = await productModel.getDelete(slug);
        if (product.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Combo không tồn tại");
        }
        return [];
    } catch (error) {
        throw error;
    }
};

export const productService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
};
