import { z } from "zod";

export const artistValidation = (data: any) => {
  const schema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    dob: z.date({ required_error: "Date of birth is required" }),
    gender: z.enum(["M", "F", "O"], { required_error: "Gender is required" }),
    first_release_year: z.number().int().min(1900, { message: "Invalid year" }),
    address: z.string().min(1, { message: "Address is required" }),
    no_of_albums_released: z
      .number()
      .int()
      .nonnegative({ message: "Number of albums released cannot be negative" }),
  });

  return schema.safeParse(data);
};
