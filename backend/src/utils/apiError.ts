export class ApiError extends Error {
  public statusCode: number;
  public meta?: Record<string, any>;

  constructor(statusCode: number, message: string, meta?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}
