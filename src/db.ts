import pkg, { Client } from "pg";
import createUserTable from "./models/user.models";
import { createArtistTable } from "./models/artist.model";
import { createMusicTable } from "./models/music.model";

const createDatabase = async () => {
  const defaultClient = new Client({
    connectionString: process.env.DEFAULT_DATABASE_URL, // Connect to a default database like 'postgres'
  });

  try {
    await defaultClient.connect();

    // Check if the 'artist' database exists
    const res = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname='artist'`
    );
    if (res.rowCount === 0) {
      // Create the 'artist' database if it does not exist
      await defaultClient.query("CREATE DATABASE artist");
      console.log("Database 'artist' created successfully.");
    } else {
      console.log("Database 'artist' already exists.");
    }
  } catch (err) {
    console.error("Error creating the database", err);
  } finally {
    await defaultClient.end();
  }
};

const setupTables = async (client: Client) => {
  try {
    await client.query(createUserTable);
    await client.query(createArtistTable);
    await client.query(createMusicTable);
    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error setting up tables", err);
  }
};

const connectDB = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Connect to the 'artist' database
  });

  try {
    await createDatabase(); // Ensure the database is created
    await client.connect(); // Connect to the 'artist' database
    console.log("Connected to the database.");

    await setupTables(client); // Set up tables
  } catch (err) {
    console.error("Error connecting to the database", err);
  } finally {
    await client.end();
  }
};

export { connectDB };
