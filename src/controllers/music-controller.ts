import { Request, Response } from "express";
import { asyncWrapper } from "../utils/async-wrapper";
import { HttpError } from "../utils/http-error";
import { Music } from "../types";
import { musicValidation } from "../validation/music";
import { client } from "../db";

export const getMusic = asyncWrapper(async (req: Request, res: Response) => {
  const result = await client.query("SELECT * FROM music");
  if (result.rowCount === 0) {
    throw new HttpError("No music records found", 404);
  }
  return res.status(200).json({ data: result.rows });
});

export const getMusicById = asyncWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await client.query({
      text: "SELECT * FROM music WHERE id = $1",
      values: [id],
    });
    if (result.rowCount === 0) {
      throw new HttpError("Music not found", 404);
    }
    return res.status(200).json({ data: result.rows[0] });
  }
);

export const getMusicByArtistId = asyncWrapper(
  async (req: Request, res: Response) => {
    try {
      const { artistId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 5;
      const search = req.query.search ? `%${req.query.search}%` : "%";
      const offset = (page - 1) * limit;

      const result = await client.query({
        text: `SELECT * FROM music WHERE artist_id = $1 AND (title ILIKE $2 OR album_name ILIKE $2) ORDER BY title LIMIT $3 OFFSET $4`,
        values: [artistId, search, limit, offset],
      });

      if (result.rowCount === 0) {
        throw new HttpError("Music not found", 404);
      }

      const totalRecordsResult = await client.query({
        text: `SELECT COUNT(*) FROM music WHERE artist_id = $1 AND (title ILIKE $2 OR album_name ILIKE $2)`,
        values: [artistId, search],
      });
      const totalRecords = parseInt(totalRecordsResult.rows[0].count, 10);

      const totalPages = Math.ceil(totalRecords / limit);
      const nextPage = page < totalPages ? page + 1 : null;

      res.status(200).json({
        data: result.rows,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          limit,
          nextPage,
          pageLimit: limit,
        },
      });
    } catch (error) {
      console.error("Error fetching music:", error);
      throw new HttpError("Internal Server Error", 500);
    }
  }
);
export const createMusic = asyncWrapper(async (req: Request, res: Response) => {
  const { artist_id } = req.params;
  console.log(req.params, "parr");

  const { title, album_name, genre } = req.body as Music;

  const validationResult = musicValidation(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map(
      (err) => err.message
    );
    throw new HttpError(errorMessages.join(", "), 400);
  }

  const artistQuery = "SELECT 1 FROM artists WHERE id = $1";
  const artistResult = await client.query(artistQuery, [artist_id]);
  if (artistResult.rowCount === 0) {
    throw new HttpError("Artist not found", 404);
  }

  const query = `
    INSERT INTO music (title, album_name, artist_id, genre)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [title, album_name, artist_id, genre];

  const result = await client.query(query, values);
  if (result.rowCount === 0) {
    throw new HttpError("Failed to create music record", 400);
  }

  return res
    .status(201)
    .json({ message: "Music created successfully", data: result.rows[0] });
});

export const deleteMusicById = asyncWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const musicExists = await client.query({
      text: "SELECT * FROM music WHERE id = $1",
      values: [id],
    });

    if (musicExists.rowCount === 0) {
      throw new HttpError("Music not found", 404);
    }

    await client.query({
      text: "DELETE FROM music WHERE id = $1 RETURNING *",
      values: [id],
    });

    return res.status(200).json({ message: "Music deleted successfully" });
  }
);

export const updateMusicById = asyncWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, album_name, artist_id, genre } = req.body as Music;

    const musicExists = await client.query({
      text: "SELECT * FROM music WHERE id = $1",
      values: [id],
    });

    if (musicExists.rowCount === 0) {
      throw new HttpError("Music not found", 404);
    }

    const query = `
    UPDATE music 
    SET title = $1, album_name = $2, artist_id = $3, genre = $4
    WHERE id = $5
    RETURNING *;`;
    const values = [title, album_name, artist_id, genre, id];

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new HttpError("Failed to update music record", 400);
    }

    return res
      .status(200)
      .json({ message: "Music updated successfully", data: result.rows[0] });
  }
);
