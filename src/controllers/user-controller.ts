import { Request, Response } from "express";
import { asyncWrapper } from "../utils/async-wrapper";
import { HttpError } from "../utils/http-error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  loginValidation,
  registerValidation,
  updateUserValidation,
} from "../validation/user";
import { generateTokens } from "../helpers/generate-token";
import { User } from "../types";
import { client } from "../db";

export const createUser = asyncWrapper(async (req: Request, res: Response) => {
  console.log(req.body, "DS");
  const { dob, ...rest } = req.body;
  const parsedDob = new Date(dob);

  if (isNaN(parsedDob.getTime())) {
    throw new HttpError("Invalid date format for dob", 400);
  }

  const requestBody = { ...rest, dob: parsedDob };
  const transformedRequestBody = {
    ...requestBody,
    gender: requestBody.gender.toUpperCase(),
  };

  const validationResult = registerValidation(requestBody);
  if (!validationResult.success) {
    throw new HttpError(
      validationResult.error.errors.map((err) => err.message).join(", "),
      400
    );
  }

  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    gender,
    address,
    role = "super_admin",
  } = transformedRequestBody;

  const existingUser = await client.query(
    'SELECT * FROM "user" WHERE email = $1',
    [email]
  );

  if (existingUser?.rowCount && existingUser?.rowCount > 0) {
    throw new HttpError("Email already exists", 400);
  }

  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await client.query(
    `INSERT INTO "user" 
      (first_name, last_name, email, password, phone, dob, gender, address, role) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
    [
      first_name,
      last_name,
      email,
      hashedPassword,
      phone,
      parsedDob,
      gender,
      address,
      role,
    ]
  );

  if (result.rowCount === 0) {
    throw new HttpError("Failed to create user", 400);
  }

  res.status(201).json(result.rows[0]);
});

export const loginUser = asyncWrapper(async (req: Request, res: Response) => {
  const validationResult = loginValidation(req.body);
  if (!validationResult.success) {
    throw new HttpError(
      validationResult.error.errors.map((err) => err.message).join(", "),
      400
    );
  }

  const { email, password } = req.body;

  const result = await client.query('SELECT * FROM "user" WHERE email = $1', [
    email,
  ]);

  if (result.rowCount === 0) {
    throw new HttpError("Invalid credentials", 401);
  }

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new HttpError("Invalid credentials", 401);
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
    user,
  });
});

export const refreshToken = asyncWrapper(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new HttpError("Refresh token is required", 400);
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as jwt.JwtPayload;
      const { userId } = decoded;

      const result = await client.query('SELECT * FROM "user" WHERE id = $1', [
        userId,
      ]);

      if (result.rowCount === 0) {
        throw new HttpError("Invalid token", 401);
      }

      const user: User = result.rows[0];

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      throw new HttpError("Invalid or expired refresh token", 401);
    }
  }
);

export const updateUser = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    throw new HttpError("Invalid user ID", 400);
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
    role,
  } = req.body;

  const validationResult = updateUserValidation(req.body);
  if (!validationResult.success) {
    throw new HttpError(
      validationResult.error.errors.map((err) => err.message).join(", "),
      400
    );
  }

  const existingUserResult = await client.query(
    'SELECT * FROM "user" WHERE id = $1',
    [id]
  );
  if (existingUserResult.rowCount === 0) {
    throw new HttpError("User not found", 404);
  }

  if (email && email !== existingUserResult.rows[0].email) {
    const emailCheckResult = await client.query(
      'SELECT * FROM "user" WHERE email = $1',
      [email]
    );
    if (emailCheckResult?.rowCount && emailCheckResult?.rowCount > 0) {
      throw new HttpError("Email already exists", 400);
    }
  }
  let hashedPassword = existingUserResult.rows[0].password;
  if (password) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  const updateFields = {
    first_name,
    last_name,
    email,
    password: hashedPassword,
    phone,
    dob: dob ? new Date(dob) : existingUserResult.rows[0].dob,
    gender: gender ? gender.toUpperCase() : existingUserResult.rows[0].gender,
    address,
    role,
  };

  const query = `
    UPDATE "user" 
    SET 
      first_name = $1,
      last_name = $2,
      email = $3,
      password = $4,
      phone = $5,
      dob = $6,
      gender = $7,
      address = $8,
      role = $9,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *`;

  const values = [
    updateFields.first_name || existingUserResult.rows[0].first_name,
    updateFields.last_name || existingUserResult.rows[0].last_name,
    updateFields.email || existingUserResult.rows[0].email,
    updateFields.password,
    updateFields.phone || existingUserResult.rows[0].phone,
    updateFields.dob,
    updateFields.gender || existingUserResult.rows[0].gender,
    updateFields.address || existingUserResult.rows[0].address,
    updateFields.role || existingUserResult.rows[0].role,
    id,
  ];
  const result = await client.query(query, values);

  if (result.rowCount === 0) {
    throw new HttpError("Failed to update user", 400);
  }

  res.status(200).json(result.rows[0]);
});
export const getUsers = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const result = await client.query('SELECT * FROM "user"');

    if (result.rowCount === 0) {
      throw new HttpError("No users found", 404);
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new HttpError("Internal Server Error", 500);
  }
});

export const getUserById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    throw new HttpError("Invalid user ID", 400);
  }

  try {
    const result = await client.query('SELECT * FROM "user" WHERE id = $1', [
      id,
    ]);

    if (result.rowCount === 0) {
      throw new HttpError("User not found", 404);
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new HttpError("Internal Server Error", 500);
  }
});

export const deleteUser = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    throw new HttpError("Invalid user ID", 400);
  }

  try {
    const userCheck = await client.query('SELECT * FROM "user" WHERE id = $1', [
      id,
    ]);
    if (userCheck.rowCount === 0) {
      throw new HttpError("User not found", 404);
    }

    const result = await client.query(
      'DELETE FROM "user" WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      throw new HttpError("Failed to delete user", 400);
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpError("Internal Server Error", 500);
  }
});
