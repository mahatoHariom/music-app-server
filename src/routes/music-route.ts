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
import { checkRoles } from "../middleware/check-role";

const router = express.Router();

router.get("/", getMusic);
router.get("/:id", getMusicById);
router.get(
  "/artist/:artistId",
  authenticate,
  // checkRoles(["artist_manager",""]),
  getMusicByArtistId
);
router.post(
  "/artist/:artist_id",
  authenticate,
  checkRoles(["artist"]),
  createMusic
);
router.delete("/:id", authenticate, checkRoles(["artist"]), deleteMusicById);
router.put(
  "/:id/update/artist/:artistId",
  authenticate,
  checkRoles(["artist"]),
  updateMusicById
);

export default router;
