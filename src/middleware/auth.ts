import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types";
import { HttpError } from "../utils/http-error";

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return next(new HttpError("No token provided", 401));
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      return next(new HttpError("Token is not valid", 401));
    }

    req.user = decoded as User;
    next();
  });
};
