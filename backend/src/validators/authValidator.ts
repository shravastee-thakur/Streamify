import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../db/schema/userSchema.js";

const insertUserSchema = createInsertSchema(users);

const imageSchema = z.object({
  url: z.string().url("Invalid image URL").or(z.literal("")),
  publicId: z.string(),
});

export const registerSchema = insertUserSchema
  .pick({
    username: true,
    email: true,
    fullname: true,
    password: true,
  })
  .extend({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email must be under 255 characters")
      .trim(),
    fullname: z
      .string()
      .max(255, "Full name must be under 255 characters")
      .trim()
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .trim(),
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = insertUserSchema
  .pick({
    fullname: true,
    username: true,
    avatar: true,
    coverImage: true,
  })
  .extend({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .trim()
      .optional(),
    fullname: z
      .string()
      .max(255, "Full name must be under 255 characters")
      .trim()
      .optional(),
    avatar: imageSchema.optional(),
    coverImage: imageSchema.optional(),
  })
  // .partial() makes all picked fields optional, as users might only update one field at a time
  .partial();

// 5. Exported Types for your Controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
