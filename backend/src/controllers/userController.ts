import { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/authValidator.js";
import * as userService from "../services/userService.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await userService.create(validatedData);
    return res
      .status(201)
      .json({
        success: true,
        message: "User registered successfullt",
        data: user,
      });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await userService.create(validatedData);
    return res
      .status(201)
      .json({
        success: true,
        message: "User registered successfullt",
        data: user,
      });
  } catch (error) {
    next(error);
  }
};
