import { Request, Response } from "express";

import { Music } from "../types";
import { musicValidation } from "../validation/music";
import { client } from "../db";

export const getMusic = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const result = await client.query("SELECT * FROM music");
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getMusicById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  try {
    const result = await client.query({
      text: "SELECT * FROM music WHERE id = $1",
      values: [id],
    });
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Music not found" });
    }
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getMusicByArtistId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { artistId } = req.params;
  try {
    const result = await client.query({
      text: "SELECT * FROM music WHERE artist_id = $1",
      values: [artistId],
    });
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Music not found" });
    }
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const createMusic = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { title, album_name, artist_id, genre } = req.body as Music;
  console.log(title, album_name, artist_id, genre, "S");
  const validationResult = musicValidation(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map(
      (err) => err.message
    );
    return res.status(400).json({ message: errorMessages });
  }
  console.log(title, album_name, artist_id, genre, "S");
  const query = `
    INSERT INTO music (title, album_name, artist_id, genre)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [title, album_name, artist_id, genre];

  try {
    const result = await client.query(query, values);
    return res
      .status(201)
      .json({ message: "Music created successfully", data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const deleteMusicById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  const musicExists = await client.query({
    text: "SELECT * FROM music WHERE id = $1",
    values: [id],
  });

  if (!musicExists.rows[0]) {
    return res.status(404).json({ message: "Music not found" });
  }
  try {
    await client.query({
      text: "DELETE FROM music WHERE id = $1 RETURNING *",
      values: [id],
    });
    return res.status(200).json({ message: "Music deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const updateMusicById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { title, album_name, artist_id, genre } = req.body as Music;

  const musicExists = await client.query({
    text: "SELECT * FROM music WHERE id = $1",
    values: [id],
  });
  if (!musicExists.rows[0]) {
    return res.status(404).json({ message: "Music not found" });
  }

  try {
    const query = `
      UPDATE music 
      SET title = $1, album_name = $2, artist_id = $3, genre = $4
      WHERE id = $5
      RETURNING *;`;
    const values = [title, album_name, artist_id, genre, id];
    const result = await client.query(query, values);
    return res
      .status(200)
      .json({ message: "Music updated successfully", data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

