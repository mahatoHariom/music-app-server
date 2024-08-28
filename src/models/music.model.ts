export const createMusicTable = `

DO $$
    BEGIN
        -- Check if genre_enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genre_enum') THEN
            CREATE TYPE genre_enum AS ENUM ('rnb', 'country', 'classic', 'rock', 'jazz');
        END IF;
    END
    $$;
   

    CREATE TABLE IF NOT EXISTS music (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) NOT NULL,
        artist_id INTEGER REFERENCES artists(id),
        genre genre_enum,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
`;
