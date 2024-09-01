import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/user-routes";
import artistRoutes from "./routes/artist-route";
import musicRoutes from "./routes/music-route";
import { errorHandler } from "./middleware/error-handler";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhot:3000",
    credentials: true,
  })
);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/artist", artistRoutes);
app.use("/api/v1/music", musicRoutes);

app.use(errorHandler);

export default app;
