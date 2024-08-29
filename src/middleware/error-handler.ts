// middlewares/error-handler.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error occurred:", err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // For unhandled errors, respond with a generic 500 Internal Server Error
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
