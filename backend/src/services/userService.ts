import { createHash, timingSafeEqual } from "crypto";
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
import { deleteImage, CloudImage, uploadImage } from "./storageService.js";

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

  const updatePayload: Partial<UserDocument> = { ...userData };

  if (files.avatar) {
    if (user?.avatar?.publicId) {
      await deleteImage(user.avatar.publicId);
    }
    const uploaded: CloudImage = await uploadImage(files.avatar);
    updatePayload.avatar = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  if (files.coverImage) {
    if (user?.coverImage?.publicId) {
      await deleteImage(user.coverImage.publicId);
    }
    const uploaded: CloudImage = await uploadImage(files.coverImage);
    updatePayload.coverImage = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  if (Object.keys(updatePayload).length === 0) {
    return formatUserResponse(user);
  }

  const updatedUser = await userRepo.updateUser(userId, updatePayload);

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update user profile");
  }

  return formatUserResponse(updatedUser);
};
