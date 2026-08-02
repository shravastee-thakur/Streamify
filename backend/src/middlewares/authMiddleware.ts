import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import logger from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.id) {
      throw new ApiError(401, "Unauthorized: Invalid token");
    }

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    logger.error(`AuthMiddleware Failure: ${(error as Error).message}`);
    console.log(error); // remove for production
    next(error);
  }
};
