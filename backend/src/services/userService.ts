import * as userRepo from "../repositories/userRepo.js";
import { ApiError } from "../utils/apiError.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/authValidator.js";
import bcrypt from "bcrypt";

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
    avatar: { url: "", publicId: "" },
    coverImage: { url: "", publicId: "" },
  });
  return user;
};
