import { z } from "zod";
import { Music } from "../types";

export const musicValidation = (data: Music) => {
  const schema = z.object({
    title: z.string().min(1, "Title is required"),
    album_name: z.string().min(1, "Album name is required"),
    artist_id: z
      .number()
      .int()
      .refine((val) => !isNaN(val), {
        message: "Artist ID is required",
      }),
    genre: z.string().min(1, "Genre is required"),
  });

  return schema.safeParse(data);
};
