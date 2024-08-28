import jwt from "jsonwebtoken";
import { User } from "../types";

export const generateTokens = (user: User) => {
  const accessToken = jwt.sign(user, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    user,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};
