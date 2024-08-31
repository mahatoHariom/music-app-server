import express from "express";
import {
  createMusic,
  deleteMusicById,
  getMusic,
  getMusicByArtistId,
  getMusicById,
  updateMusicById,
} from "../controllers/music-controller";

const router = express.Router();

router.get("/", getMusic);
router.get("/:id", getMusicById);
router.get("/artist/:artistId", getMusicByArtistId);
router.post("/artist/:artist_id", createMusic);
router.delete("/:id", deleteMusicById);
router.put("/:id/update/artist/:artistId", updateMusicById);

export default router;
