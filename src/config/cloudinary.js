import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/environment";

const fs = require("fs");

// Configuration
cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.API_KEY,
  api_secret: env.API_SECRET,
});

async function uploadImage(reqImages, folderStorage, width, height) {
  try {
    // reqImages trả về mã nhị phân
    // -> Biến đổi thành path
    // Ghi buffer vào tệp tạm thời
    const tempFilePath = reqImages.originalname;
    fs.writeFileSync(tempFilePath, reqImages.buffer);

    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: `VieFilm/${folderStorage}`,
      width: width, // Chiều rộng ảnh
      height: height, // Chiều cao ảnh
      crop: "fill",
    });
    // Xóa tệp tạm thời
    fs.unlinkSync(tempFilePath);

    // Trả về URL,tên ảnh của ảnh đã tải lên
    return {
      url: result.secure_url,
      fileImage: result.display_name,
    };
  } catch (error) {
    console.error("Lỗi khi tải ảnh lên Cloudinary:", error);
    throw error;
  }
}

async function deleteImage(folderStorage, fileImage) {
  try {
    const result = await cloudinary.uploader.destroy(
      `VieFilm/${folderStorage}/${fileImage}`
    );
    return result;
  } catch (error) {
    console.error("Lỗi khi xóa ảnh:", error);
    throw error;
  }
}

async function uploadImages(reqImagesArray, folderStorage, width, height) {
  try {
    const uploadPromises = reqImagesArray.map(async (reqImage) => {
      const tempFilePath = reqImage.originalname;
      fs.writeFileSync(tempFilePath, reqImage.buffer);

      const result = await cloudinary.uploader.upload(tempFilePath, {
        folder: `VieFilm/${folderStorage}`,
        width: width,
        height: height,
        crop: "fill",
      });
      fs.unlinkSync(tempFilePath);

      return {
        url: result.secure_url,
        fileImage: result.display_name,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults;

  } catch (error) {
    console.error("Lỗi khi tải nhiều ảnh lên Cloudinary:", error);
    throw error;
  }
}

async function deleteImages(folderStorage, fileImagesArray) {
  try {
    const deleteResults = [];

    for (const images of fileImagesArray) {
      const result = await cloudinary.uploader.destroy(
        `VieFilm/${folderStorage}/${images.fileImage}`
      );
      deleteResults.push(result);
    }
    return deleteResults;
  } catch (error) {
    console.error("Lỗi khi xóa nhiều ảnh:", error);
    throw error;
  }
}

module.exports = { uploadImage, deleteImage, uploadImages, deleteImages };
