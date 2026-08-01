import { uploadImageToCloudinary } from "../config/cloudinary.js";
import * as userRepo from "../repositories/userRepo.js";
import { ApiError } from "../utils/apiError.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/authValidator.js";
import bcrypt from "bcrypt";

export const create = async (userData: RegisterInput, fileBuffer: Buffer) => {
  const existingUser = await userRepo.existingUser(
    userData.email,
    userData.username,
  );
  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  // if(fileBuffer){
  //   const uploadImage = await uploadImageToCloudinary(fileBuffer)
  //   userData.
  // }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await userRepo.createUser({
    username: userData.username,
    email: userData.email,
    fullname: userData.fullname,
    password: hashedPassword,
  });
  return user;
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

  return user;
};
