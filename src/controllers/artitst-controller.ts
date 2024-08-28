import { client } from "../db";
import { artistValidation } from "../validation/artist";

export const createArtist = async (req: Request, res: Response) => {
  const {
    name,
    dob,
    gender,
    first_release_year,
    address,
    no_of_albums_released,
  } = req.body;

  const { error } = artistValidation(req.body);
  if (error) {
    const errorMessages = error.errors.map((err) => err.message);
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const artistExists = await client.query({
      text: "SELECT * FROM artist WHERE name = $1",
      values: [name],
    });

    if (artistExists.rows.length > 0) {
      return res.status(400).json({ message: "Artist already exists" });
    }

    const query = `
        INSERT INTO artist (name, dob, gender, first_release_year, address, no_of_albums_released) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
    const values = [
      name,
      dob,
      gender,
      first_release_year,
      address,
      no_of_albums_released,
    ];
    const result = await client.query(query, values);
    return res
      .status(201)
      .json({ message: "Artist created successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Error creating artist:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
