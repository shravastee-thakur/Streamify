import { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/authValidator.js";
import * as userService from "../services/userService.js";
import { sendAuthResponse } from "../helper/sendAuthResponse.js";
import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await userService.create(validatedData);
    return res.status(201).json({
      success: true,
      message: "User registered successfullt",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const sessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } =
      await userService.login(validatedData);

    return sendAuthResponse(
      res,
      { accessToken, refreshToken },
      user,
      "Login successful",
    );
  } catch (error) {
    next(error);
  }
};

export const createToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "No refresh token provided");
    }

    const { user, accessToken, refreshToken } =
      await userService.refreshAccessToken(incomingRefreshToken);

    return sendAuthResponse(
      res,
      { accessToken, refreshToken },
      user,
      "Token refreshed successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const destroySession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    await userService.logout(userId);

    return res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      })
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }
    const validatedData = updateProfileSchema.parse(req.body);

    // Extract the buffers from the Multer fields object
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const updateFiles = {
      avatar: files?.avatar?.[0]?.buffer,
      coverImage: files?.coverImage?.[0]?.buffer,
    };

    const user = await userService.updateUser(
      userId,
      validatedData,
      updateFiles,
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};
