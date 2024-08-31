import { Request, Response } from "express";
import csvParser from "csv-parser";
import fs from "fs";
import { artistValidation } from "../validation/artist";
import { client } from "../db";
import { Artist } from "../types";
import { HttpError } from "../utils/http-error";
import { asyncWrapper } from "../utils/async-wrapper";

export const createArtist = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { dob, ...rest } = req.body;

  const parsedDob = new Date(dob);
  if (isNaN(parsedDob.getTime())) {
    throw new HttpError("Invalid date format for dob", 400);
  }

  const requestBody = { ...rest, dob: parsedDob };
  const validationResult = artistValidation(requestBody);

  if (!validationResult.success) {
    throw new HttpError(
      validationResult.error.errors.map((err) => err.message).join(", "),
      400
    );
  }

  const { name, gender, first_release_year, address, no_of_albums_released } =
    requestBody;

  try {
    const artistExists = await client.query({
      text: "SELECT * FROM artist WHERE name = $1",
      values: [name],
    });

    if (artistExists.rows.length > 0) {
      throw new HttpError("Artist already exists", 400);
    }

    const query = `
        INSERT INTO artist (name, dob, gender, first_release_year, address, no_of_albums_released) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;

    const values = [
      name,
      parsedDob,
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
    throw new HttpError("Internal server error", 500);
  }
};

export const getArtists = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 5;
    const search = req.query.search ? `%${req.query.search}%` : "%";
    const offset = (page - 1) * limit;

    const result = await client.query(
      `SELECT * FROM artist
       WHERE name ILIKE $1
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );

    if (result.rowCount === 0) {
      throw new HttpError("No artists found", 404);
    }

    const totalArtistsResult = await client.query(
      `SELECT COUNT(*) FROM artist
       WHERE name ILIKE $1`,
      [search]
    );
    const totalArtists = parseInt(totalArtistsResult.rows[0].count, 10);

    const totalPages = Math.ceil(totalArtists / limit);
    const nextPage = page < totalPages ? page + 1 : null;

    res.status(200).json({
      artists: result.rows,
      pagination: {
        totalArtists,
        totalPages,
        currentPage: page,
        limit,
        nextPage,
        pageLimit: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw new HttpError("Internal Server Error", 500);
  }
});
export const getArtistById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  console.log("w");
  try {
    const result = await client.query({
      text: "SELECT * FROM artist WHERE id = $1",
      values: [id],
    });

    if (result.rows.length === 0) {
      throw new HttpError("Artist not found", 404);
    }

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching artist by ID:", error);
    throw new HttpError("Internal server error", 500);
  }
};

export const updateArtistById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const {
    name,
    dob,
    gender,
    first_release_year,
    address,
    no_of_albums_released,
  } = req.body.artist;

  const parsedDob = new Date(dob);

  const validatedBody = {
    name,
    dob: parsedDob,
    gender,
    first_release_year,
    address,
    no_of_albums_released,
  };

  const validationResult = artistValidation(validatedBody);

  if (!validationResult.success) {
    throw new HttpError(
      validationResult.error.errors.map((err) => err.message).join(", "),
      400
    );
  }

  try {
    const artistExists = await client.query({
      text: "SELECT * FROM artist WHERE id = $1",
      values: [id],
    });

    if (artistExists.rows.length === 0) {
      throw new HttpError("Artist not found", 404);
    }

    const query = `
        UPDATE artist 
        SET name = $1, dob = $2, gender = $3, first_release_year = $4, address = $5, no_of_albums_released = $6 
        WHERE id = $7
      `;
    const values = [
      name,
      parsedDob,
      gender,
      first_release_year,
      address,
      no_of_albums_released,
      id,
    ];

    await client.query(query, values);

    return res.status(200).json({ message: "Artist updated successfully" });
  } catch (error) {
    console.error("Error updating artist:", error);
    throw new HttpError("Internal server error", 500);
  }
};

export const deleteArtistById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  try {
    const result = await client.query({
      text: "DELETE FROM artist WHERE id = $1",
      values: [id],
    });

    if (result.rowCount === 0) {
      throw new HttpError("Artist not found", 404);
    }

    return res.status(200).json({ message: "Artist deleted successfully" });
  } catch (error) {
    console.error("Error deleting artist:", error);
    throw new HttpError("Internal server error", 500);
  }
};

export const uploadArtists = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const results: Artist[] = [];
    console.log(req.file, "fle");

    fs.createReadStream(req.file?.path || "")
      .pipe(csvParser({ separator: "," }))
      .on("data", (row: Artist) => results.push(row))
      .on("end", async () => {
        const query = `
            INSERT INTO artist (name, dob, gender, first_release_year, address, no_of_albums_released, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `;
        try {
          await Promise.all(
            results.map(async (artist: Artist) => {
              const {
                name,
                dob,
                gender,
                first_release_year,
                address,
                no_of_albums_released,
              } = artist;
              const values = [
                name,
                dob,
                gender,
                first_release_year,
                address,
                no_of_albums_released,
              ];

              await client.query(query, values);
            })
          );
          return res
            .status(201)
            .json({ message: "Artists uploaded successfully" });
        } catch (error) {
          console.error("Error inserting artist from CSV:", error);
          throw new HttpError("Failed to insert artists from CSV", 500);
        }
      })
      .on("error", (error: Error) => {
        console.error("Error uploading CSV:", error);
        throw new HttpError("Failed to upload the CSV", 500);
      });
  } catch (error) {
    console.error("Error handling CSV upload:", error);
    throw new HttpError("Failed to upload the CSV", 500);
  }
};

export const exportArtist = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  try {
    const query = `
        SELECT * FROM artist WHERE id = $1
      `;
    const result = await client.query({
      text: query,
      values: [id],
    });

    if (result.rows.length === 0) {
      throw new HttpError("Artist not found", 404);
    }

    const artist = result.rows[0];
    const column_names = Object.keys(artist);
    let csv = column_names.join(",") + "\n";
    csv += column_names.map((column) => artist[column]).join(",") + "\n";

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting artist data:", error);
    throw new HttpError("Internal Server Error", 500);
  }
};

export const exportAllArtists = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const query = `SELECT * FROM artist`;
    const result = await client.query(query);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).send("No artists found");
    }

    const columnNames = Object.keys(rows[0]);
    let csv = columnNames.join(",") + "\n";

    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) {
        return "";
      }
      let str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    rows.forEach((row) => {
      csv +=
        columnNames.map((col) => escapeCsvValue(row[col])).join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=artists_all.csv"
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting artists data:", error);
    return res.status(500).send("Internal Server Error");
  }
};
