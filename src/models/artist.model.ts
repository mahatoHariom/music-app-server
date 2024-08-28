export const createArtistTable = `
    CREATE TABLE IF NOT EXISTS "artist" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
          gender VARCHAR(255) CHECK (gender IN ('M', 'F','O')),
        address VARCHAR(255) NOT NULL,
        first_release_year INT NOT NULL,
        no_of_albums_released INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
`;
