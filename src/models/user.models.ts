const createUserTable = `
    DO $$
    BEGIN
        -- Check if gender_enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
            CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
        END IF;

        -- Check if role_enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
            CREATE TYPE role_enum AS ENUM ('super_admin', 'artist_manager', 'artist');
        END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        password VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        gender gender_enum,
        dob DATE NOT NULL,
        role role_enum DEFAULT 'super_admin'
    );
`;

export default createUserTable;
