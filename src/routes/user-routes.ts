import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  loginUser,
  refreshToken,
} from "../controllers/user-controller";

const router = Router();

router.post("/create", createUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.get("/all", getUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

export default router;
