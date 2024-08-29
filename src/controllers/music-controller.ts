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
    const { artistId } = req.params;
    const result = await client.query({
      text: "SELECT * FROM music WHERE artist_id = $1",
      values: [artistId],
    });
    if (result.rowCount === 0) {
      throw new HttpError("Music not found", 404);
    }
    return res.status(200).json({ data: result.rows });
  }
);

export const createMusic = asyncWrapper(async (req: Request, res: Response) => {
  const { title, album_name, artist_id, genre } = req.body as Music;
  const validationResult = musicValidation(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map(
      (err) => err.message
    );
    throw new HttpError(errorMessages.join(", "), 400);
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
