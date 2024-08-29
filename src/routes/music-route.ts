import express from "express";
import {
  createMusic,
  deleteMusicById,
  getMusic,
  getMusicByArtistId,
  getMusicById,
  updateMusicById,
} from "../controllers/music-controller";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/", getMusic);
router.get("/:id", authenticate, getMusicById);
router.get("/artist/:artistId", authenticate, getMusicByArtistId);
router.post("/", authenticate, createMusic);
router.delete("/:id", authenticate, deleteMusicById);
router.put("/:id", authenticate, updateMusicById);

export default router;
