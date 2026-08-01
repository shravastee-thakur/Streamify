import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadImageToCloudinary = (
  file: Buffer,
): Promise<UploadApiResponse> => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "CineFlow",
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else {
          reject(new Error("Cloudinary upload failed with no result"));
        }
      },
    );
    stream.end(file);
  });
};
