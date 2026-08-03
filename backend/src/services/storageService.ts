import cloudinary from "../config/cloudinary.js";
import logger from "../utils/logger.js";

export interface CloudImage {
  url: string;
  publicId: string;
}

export const uploadImage = async (file: Buffer): Promise<CloudImage> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "CineFlow",
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          reject(new Error("Image upload failed"));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error("Cloudinary upload failed with no result"));
        }
      },
    );

    stream.end(file);
  });
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    if (result.result !== "ok") {
      logger.warn(
        `Cloudinary deletion issue for ${publicId}: ${result.result}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    logger.error(
      `Cloudinary delete failed for ${publicId}: ${(error as Error).message}`,
    );
    return false;
  }
};
