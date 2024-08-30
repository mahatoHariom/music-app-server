import { z } from "zod";
import { LoginData, RegisterData, UpdateUserData } from "../types";

export const loginValidation = (data: LoginData) => {
  const schema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  });

  return schema.safeParse(data);
};

export const registerValidation = (data: RegisterData) => {
  const schema = z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    address: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Invalid email" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    dob: z.date({ required_error: "Date of birth is required" }),
    gender: z.enum(["M", "F", "O"], {
      required_error: "Gender is required",
    }),
  });

  return schema.safeParse(data);
};

export const updateUserValidation = (data: UpdateUserData) => {
  const schema = z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Invalid email" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    dob: z.string({ required_error: "Date of birth is required" }),
    gender: z.enum(["M", "F", "O"]),
    address: z.string().min(1, { message: "Address is required" }),
  });
  return schema.safeParse(data);
};
