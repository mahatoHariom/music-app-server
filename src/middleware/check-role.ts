import { Request, Response, NextFunction } from "express";
import { Role } from "../types";

export const checkRoles = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req?.user?.role as Role)) {
      console.log(req.user, "user");
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
