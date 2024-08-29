const createUserTable = `
    DROP TABLE IF EXISTS "user" CASCADE;
    CREATE TABLE "user" (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        password VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        gender gender_enum NOT NULL,
        dob DATE NOT NULL,
        role VARCHAR(255) CHECK (role IN ('super_admin', 'artist_manager', 'artist'))
    );
`;

export default createUserTable;

export const createEnums = `
  DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('M', 'F', 'O');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('super_admin', 'artist_manager', 'artist');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    CREATE TYPE genre_enum AS ENUM ('rnb', 'country', 'classic', 'rock', 'jazz');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
`;
