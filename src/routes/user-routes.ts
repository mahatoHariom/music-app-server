import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  loginUser,
  refreshToken,
  updateUser,
} from "../controllers/user-controller";

const router = Router();

router.post("/", createUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.put("/:id", updateUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.delete("/delete/:id", deleteUser);

export default router;
