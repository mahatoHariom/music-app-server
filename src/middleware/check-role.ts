import { Request, Response, NextFunction } from "express";
import { Role } from "../types";

export const checkRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req?.user?.role !== role) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
