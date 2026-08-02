import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

export interface TokenPayload {
  id: string;
}

const accessSecret = env.ACCESS_SECRET;
const refreshSecret = env.REFRESH_SECRET;
if (!accessSecret || !refreshSecret) {
  throw new ApiError(500, "environment variables are not defined");
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, accessSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, refreshSecret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, accessSecret) as TokenPayload;
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, refreshSecret) as TokenPayload;
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};
