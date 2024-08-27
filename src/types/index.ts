// Type for 'gender' enum
export type Gender = "M" | "F" | "O";

export type Role = "super_admin" | "artist_manager" | "artist";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  dob?: Date;
  gender: Gender;
  address?: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface Artist {
  id: number;
  name: string;
  dob?: Date;
  gender: Gender;
  address?: string;
  first_release_year?: Date;
  no_of_albums_released?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Song {
  id: number;
  artist_id: number;
  title: string;
  album_name?: string;
  genre: "rnb" | "country" | "Classic" | "Rock" | "Jazz";
  created_at: Date;
  updated_at: Date;
}
