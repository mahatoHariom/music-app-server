import pkg, { Client, PoolClient } from "pg";
import createUserTable, { createEnums } from "./models/user.models";
import { createArtistTable } from "./models/artist.model";
import { createMusicTable } from "./models/music.model";
import bcrypt from "bcrypt";
const createDatabase = async () => {
  const defaultClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "real_database",
  });

  try {
    await defaultClient.connect();

    const res = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname='real_database'`
    );
    if (res.rowCount === 0) {
      await defaultClient.query(`CREATE DATABASE real_database`);
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
    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);

    // Hash passwords
    const hashedPasswordSuperAdmin = await bcrypt.hash("admin123", saltRounds);

    await createDatabase();
    await client.connect();
    await client.query(createEnums);
    await client.query(createUserTable);
    await client.query(createArtistTable);
    await client.query(createMusicTable);
    await client.query(
      `
      INSERT INTO "user" (first_name, last_name, email, phone, address, password, gender, dob, role)
      VALUES
        ('super', 'admin', 'superadmin@gmail.com', '123-456-7890', '123 Main St', $1, 'M', '1990-01-01', 'super_admin'),
        ('artist', 'manager', 'artistmanager@gmail.com', '123-456-7890', '123 Main St', $2, 'M', '1990-01-01', 'artist_manager'),
        ('artist', 'artist', 'artist@gmail.com', '123-456-7890', '123 Main St', $3, 'M', '1990-01-01', 'artist')
      ON CONFLICT (email) DO NOTHING;
    `,
      [
        hashedPasswordSuperAdmin,
        hashedPasswordSuperAdmin,
        hashedPasswordSuperAdmin,
      ]
    );
  } catch (err) {
    console.error("Error connecting to the database", err);
  }
};

export { client, connectDB };
