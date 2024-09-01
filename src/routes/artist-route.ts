import { Router } from "express";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import {
  createArtist,
  deleteArtistById,
  exportAllArtists,
  exportArtist,
  getArtistById,
  getArtists,
  updateArtistById,
  uploadArtists,
} from "../controllers/artitst-controller";
import { authenticate } from "../middleware/auth";
import { checkRoles } from "../middleware/check-role";

const router = Router();

router.post("/", authenticate, checkRoles(["artist_manager"]), createArtist);
router.get(
  "/",
  authenticate,
  checkRoles(["super_admin", "artist_manager"]),
  getArtists
);
router.get("/:id", getArtistById);
router.put(
  "/update/:id",
  authenticate,
  checkRoles(["artist_manager"]),
  updateArtistById
);
router.delete("/:id", deleteArtistById);
router.get(
  "/export/all",
  authenticate,
  checkRoles(["artist_manager"]),
  exportAllArtists
);
router.get(
  "/download/:id",
  authenticate,
  checkRoles(["artist_manager"]),
  exportArtist
);

router.post(
  "/upload",
  upload.single("file"),
  authenticate,
  checkRoles(["artist_manager"]),
  uploadArtists
);

export default router;
