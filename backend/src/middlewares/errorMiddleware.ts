import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { ZodError } from "zod";

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  column?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let meta = err instanceof ApiError ? err.meta : null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    meta = err.meta;
  }

  // Handle PostgreSQL unique constraint violation
  else if (err.code === "23505") {
    statusCode = 409;
    message = `Duplicate entry: ${err.constraint || "unique constraint violated"}`;
  }

  // Handle PostgreSQL foreign key violation
  else if (err.code === "23503") {
    statusCode = 400;
    message = `Invalid reference: ${err.detail || "foreign key constraint violated"}`;
  }

  // Handle PostgreSQL not null violation
  else if (err.code === "23502") {
    statusCode = 400;
    message = `Missing required field: ${err.column || "column cannot be null"}`;
  }

  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues.map((issue) => issue.message).join(", ");
  }

  // Handle invalid UUID format
  else if (err.code === "22P02") {
    statusCode = 400;
    message = "Invalid ID format";
  } else {
    message = err.message || message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    meta,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
