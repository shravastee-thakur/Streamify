import { createHash, timingSafeEqual } from "crypto";
import { uploadImageToCloudinary } from "../config/cloudinary.js";
import * as userRepo from "../repositories/userRepo.js";
import { UserDocument } from "../repositories/userRepo.js";
import { ApiError } from "../utils/apiError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/authValidator.js";
import bcrypt from "bcrypt";
import logger from "../utils/logger.js";
import { v2 as cloudinary } from "cloudinary";

interface UpdateFiles {
  avatar?: Buffer;
  coverImage?: Buffer;
}

const formatUserResponse = (user: UserDocument) => {
  const { password, refreshToken, ...safeUser } = user;
  return safeUser;
};

export const create = async (userData: RegisterInput) => {
  const existingUser = await userRepo.existingUser(
    userData.email,
    userData.username,
  );
  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await userRepo.createUser({
    username: userData.username,
    email: userData.email,
    fullname: userData.fullname,
    password: hashedPassword,
  });
  return formatUserResponse(user);
};

export const login = async (loginData: LoginInput) => {
  const isEmail = loginData.identifier.includes("@");

  const user = isEmail
    ? await userRepo.findByEmail(loginData.identifier)
    : await userRepo.findByUserName(loginData.identifier);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(loginData.password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  const hashedRefreshToken = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await userRepo.updateRefreshToken(user.id, hashedRefreshToken);

  return {
    user: formatUserResponse(user),
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (incomingRefreshToken: string) => {
  let decoded: TokenPayload;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await userRepo.findById(decoded.id);
  if (!user || !user.refreshToken)
    throw new ApiError(404, "User or session not found");

  const hashedIncomingToken = createHash("sha256")
    .update(incomingRefreshToken)
    .digest("hex");

  // Prepare Buffers for a timing-safe comparison
  const storedBuffer = Buffer.from(user.refreshToken, "hex");
  const hashBuffer = Buffer.from(hashedIncomingToken, "hex");

  const isMatch =
    storedBuffer.length === hashBuffer.length &&
    timingSafeEqual(storedBuffer, hashBuffer);

  if (!isMatch) {
    await userRepo.updateRefreshToken(user.id, null);
    throw new ApiError(
      401,
      "Refresh token reuse detected. All sessions revoked.",
    );
  }

  const newAccessToken = generateAccessToken({ id: user.id });
  const newRefreshToken = generateRefreshToken({ id: user.id });

  const hashedNewRefreshToken = createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  // Update the database with the newly rotated token
  await userRepo.updateRefreshToken(user.id, hashedNewRefreshToken);

  return {
    user: formatUserResponse(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId: string) => {
  if (!userId) return;

  await userRepo.updateRefreshToken(userId, null);
};

export const updateUser = async (
  userId: string,
  userData: UpdateProfileInput,
  files: UpdateFiles = {},
) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  let newAvatar = user.avatar;
  let newCoverImage = user.coverImage;

  if (files.avatar) {
    if (user?.avatar?.publicId) {
      try {
        const deleteResult = await cloudinary.uploader.destroy(
          user.avatar?.publicId,
          { invalidate: true },
        );
        logger.info(
          `Cloudinary delete result: ${JSON.stringify(deleteResult)}`,
        );
        if (deleteResult.result !== "ok") {
          logger.warn(
            `Failed to delete image. Public ID: ${user.avatar.publicId}. Result: ${deleteResult.result}`,
          );
        }
      } catch (cloudinaryError) {
        logger.error(
          `Error deleting old image from Cloudinary: ${(cloudinaryError as Error).message}`,
        );
      }
    }
    const uploadImage = await uploadImageToCloudinary(files.avatar);
    userData.avatar = {
      url: uploadImage.url,
      publicId: uploadImage.public_id,
    };
  }

  if (files.coverImage) {
    if (user?.coverImage?.publicId) {
      try {
        const deleteResult = await cloudinary.uploader.destroy(
          user.coverImage?.publicId,
          { invalidate: true },
        );
        logger.info(
          `Cloudinary delete result: ${JSON.stringify(deleteResult)}`,
        );
        if (deleteResult.result !== "ok") {
          logger.warn(
            `Failed to delete image. Public ID: ${user.coverImage.publicId}. Result: ${deleteResult.result}`,
          );
        }
      } catch (cloudinaryError) {
        logger.error(
          `Error deleting old image from Cloudinary: ${(cloudinaryError as Error).message}`,
        );
      }
    }
    const uploadImage = await uploadImageToCloudinary(files.coverImage);
    userData.coverImage = {
      url: uploadImage.url,
      publicId: uploadImage.public_id,
    };
  }

  const updatePayload = {
    ...userData,
    avatar: newAvatar,
    coverImage: newCoverImage,
  };

  const updatedUser = await userRepo.updateUser(userId, updatePayload);

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update user profile");
  }

  return formatUserResponse(updatedUser);
};
