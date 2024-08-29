import { Router } from "express";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import {
  createArtist,
  deleteArtistById,
  getArtistById,
  getArtists,
  importArtist,
  updateArtistById,
  uploadArtists,
} from "../controllers/artitst-controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", createArtist);
router.get("/", getArtists);
router.get("/download", importArtist);
router.get("/:id", getArtistById);
router.put("/update/:id", authenticate, updateArtistById);
router.delete("/:id", deleteArtistById);
router.post("/upload", upload.single("file"), uploadArtists);

export default router;
