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
        gender VARCHAR(255) CHECK (gender IN ('M', 'F', 'O')),
        dob DATE NOT NULL,
        role VARCHAR(255) CHECK (role IN ('super_admin', 'artist_manager', 'artist'))
    );
`;

export default createUserTable;
