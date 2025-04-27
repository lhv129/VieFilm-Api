import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/environment";

// Configuration
cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.API_KEY,
  api_secret: env.API_SECRET,
});

async function uploadImage(reqImage, folderStorage, width, height) {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `VieFilm/${folderStorage}`,
          width: width,
          height: height,
          crop: "fill",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(reqImage.buffer);
    });

    return {
      url: result.secure_url,
      fileImage: result.public_id.split("/").pop(), // lấy tên file
    };
  } catch (error) {
    console.error("Lỗi khi tải ảnh lên Cloudinary:", error);
    throw error;
  }
}

async function deleteImage(folderStorage, fileImage) {
  try {
    const publicId = `VieFilm/${folderStorage}/${fileImage}`;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Lỗi khi xóa ảnh:", error);
    throw error;
  }
}

async function uploadImages(reqImagesArray, folderStorage, width, height) {
  try {
    const uploadPromises = reqImagesArray.map((reqImage) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `VieFilm/${folderStorage}`,
            width: width,
            height: height,
            crop: "fill",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              fileImage: result.public_id.split("/").pop(),
            });
          }
        );
        stream.end(reqImage.buffer);
      })
    );

    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults;
  } catch (error) {
    console.error("Lỗi khi tải nhiều ảnh lên Cloudinary:", error);
    throw error;
  }
}

async function deleteImages(folderStorage, fileImagesArray) {
  try {
    const deletePromises = fileImagesArray.map((image) => {
      const publicId = `VieFilm/${folderStorage}/${image.fileImage}`;
      return cloudinary.uploader.destroy(publicId);
    });

    const deleteResults = await Promise.all(deletePromises);
    return deleteResults;
  } catch (error) {
    console.error("Lỗi khi xóa nhiều ảnh:", error);
    throw error;
  }
}

module.exports = { uploadImage, deleteImage, uploadImages, deleteImages };
