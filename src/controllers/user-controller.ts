import { Request, Response } from "express";
import { asyncWrapper } from "../utils/async-wrapper";
import { HttpError } from "../utils/http-error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { loginValidation, registerValidation } from "../validation/user";
import { generateTokens } from "../helpers/generate-token";
import { User } from "../types";
import { client } from "../db";

export const createUser = asyncWrapper(async (req: Request, res: Response) => {
  // Extract and parse dob from request body
 
  const { dob, ...rest } = req.body;
  const parsedDob = new Date(dob);

  // Check if parsedDob is a valid date
  if (isNaN(parsedDob.getTime())) {
    throw new HttpError(400, "Invalid date format for dob");
  }

  // Prepare the request body with parsed dob
  const requestBody = { ...rest, dob: parsedDob };
  const transformedRequestBody = {
    ...requestBody,
    gender: requestBody.gender.toUpperCase(),
  };

  const validationResult = registerValidation(requestBody);
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
    gender,
    address,
    role = "super_admin",
  } = transformedRequestBody;

  // Check for existing user
  const existingUser = await client.query(
    'SELECT * FROM "user" WHERE email = $1',
    [email]
  );

  if (existingUser?.rowCount && existingUser?.rowCount > 0) {
    throw new HttpError(400, "Email already exists");
  }

  // Hash the password
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Insert the new user into the database
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

  const result = await client.query('SELECT * FROM "user" WHERE email = $1', [
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
      const result = await client.query('SELECT * FROM "user" WHERE id = $1', [
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

export const getUsers = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const result = await client.query('SELECT * FROM "user"');
    console.log(result);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new HttpError(500, "Internal Server Error");
  }
});

export const getUserById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    throw new HttpError(400, "Invalid user ID");
  }

  try {
    const result = await client.query('SELECT * FROM "user" WHERE id = $1', [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new HttpError(500, "Internal Server Error");
  }
});

export const deleteUser = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isNaN(parseInt(id, 10))) {
    throw new HttpError(400, "Invalid user ID");
  }

  try {
    const userCheck = await client.query('SELECT * FROM "user" WHERE id = $1', [
      id,
    ]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await client.query(
      'DELETE FROM "user" WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      throw new HttpError(400, "Failed to delete user");
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpError(500, "Internal Server Error");
  }
});
