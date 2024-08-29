import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/user-routes";
import artistRoutes from "./routes/artist-route";
import musicRoutes from "./routes/music-route";
import { errorHandler } from "./middleware/error-handler";
import cors from "cors";
import dotenv from "dotenv";

// initialize the dotenv so that all env file can be properly read
dotenv.config();
// initialize app here
const app = express();

// use to parse the json object
app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true,
  })
);

// use the  routes here
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/artist", artistRoutes);
app.use("/api/v1/music", musicRoutes);

// we have created a middleware to catch the  error
app.use(errorHandler);

export default app;
