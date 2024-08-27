import { Request, Response } from "express";
import pool from "../db";
import { asyncWrapper } from "../utils/async-wrapper";
import { HttpError } from "../utils/http-error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = asyncWrapper(async (req: Request, res: Response) => {
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

  const existingUser = await pool.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
  );

  if (existingUser?.rowCount && existingUser?.rowCount > 0) {
    throw new HttpError(400, "Email already exists");
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await pool.query(
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
  const { email, password } = req.body;

  const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [
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
