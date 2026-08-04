import { env } from "../config/env.js";
import { Response } from "express";
import { UserDocument } from "../repositories/userRepo.js";

export type SafeUser = Omit<UserDocument, "password" | "refreshToken">;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const sendAuthResponse = (
  res: Response,
  tokens: AuthTokens,
  user: SafeUser,
  message: string = "Success",
) => {
  return res
    .cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      success: true,
      message,
      accessToken: tokens.accessToken,
      user,
    });
};
