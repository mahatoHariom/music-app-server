import pkg, { Client } from "pg";
import createUserTable from "./models/user.models";
import { createArtistTable } from "./models/artist.model";
import { createMusicTable } from "./models/music.model";

const createDatabase = async () => {
  const defaultClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "new_artist_manage",
  });

  try {
    await defaultClient.connect();

    const res = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname='new_artist_manage'`
    );
    if (res.rowCount === 0) {
      await defaultClient.query(`CREATE DATABASE new_artist_manage`);
      console.log(`Database new_artist_manage created successfully.`);
    } else {
      console.log(`Database new_artist_manage already exists.`);
    }
  } catch (err) {
    console.error("Error creating the database", err);
  } finally {
    await defaultClient.end();
  }
};

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "new_artist_manage",
});
const connectDB = async () => {
  try {
    await createDatabase();
    await client.connect();
    await client.query(createUserTable);
    await client.query(createArtistTable);
    await client.query(createMusicTable);
  } catch (err) {
    console.error("Error connecting to the database", err);
  }
};

export { client, connectDB };
