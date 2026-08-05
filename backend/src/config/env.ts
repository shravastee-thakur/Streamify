import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

// Dynamically load the correct environment file
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

const envSchema = z.object({
  PORT: z.string().default("8000"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  HMAC_SECRET: z.string().min(10, "HMAC_SECRET is required and must be secure"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  ACCESS_SECRET: z.string().min(1),
  REFRESH_SECRET: z.string().min(1),

  CLOUDINARY_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:");
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
