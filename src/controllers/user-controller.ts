import { Request, Response } from "express";
import { asyncWrapper } from "../utils/async-wrapper";
import { HttpError } from "../utils/http-error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { client } from "../db";
import { loginValidation, registerValidation } from "../validation/user";
import { generateTokens } from "../helpers/generate-token";
import { User } from "../types";

export const createUser = asyncWrapper(async (req: Request, res: Response) => {
  const validationResult = registerValidation(req.body);
  if (!validationResult.success) {
    throw new HttpError(
      400,
      validationResult.error.errors.map((err) => err.message).join(", ")
    );
  }

  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    dob,
    gender,
    address,
    role = "super_admin",
  } = req.body;

  const existingUser = await client.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
  );

  if (existingUser?.rowCount && existingUser?.rowCount > 0) {
    throw new HttpError(400, "Email already exists");
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await client.query(
    `INSERT INTO "User" 
      (first_name, last_name, email, password, phone, dob, gender, address, role) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
    [
      first_name,
      last_name,
      email,
      hashedPassword,
      phone,
      dob,
      gender,
      address,
      role,
    ]
  );

  if (result.rowCount === 0) {
    throw new HttpError(400, "Failed to create user");
  }

  res.status(201).json(result.rows[0]);
});

export const loginUser = asyncWrapper(async (req: Request, res: Response) => {
  const validationResult = loginValidation(req.body);
  if (!validationResult.success) {
    throw new HttpError(
      400,
      validationResult.error.errors.map((err) => err.message).join(", ")
    );
  }

  const { email, password } = req.body;

  const result = await client.query('SELECT * FROM "User" WHERE email = $1', [
    email,
  ]);

  if (result.rowCount === 0) {
    throw new HttpError(401, "Invalid credentials");
  }

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: "7d",
    }
  );

  res.status(200).json({
    accessToken,
    refreshToken,
  });
});

export const refreshToken = asyncWrapper(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new HttpError(400, "Refresh token is required");
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as jwt.JwtPayload;
      const { userId } = decoded;

      // Check if the user exists
      const result = await client.query('SELECT * FROM "User" WHERE id = $1', [
        userId,
      ]);

      if (result.rowCount === 0) {
        throw new HttpError(401, "Invalid token");
      }

      const user: User = result.rows[0];

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      throw new HttpError(401, "Invalid or expired refresh token");
    }
  }
);
