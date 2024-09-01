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
import { authenticate } from "../middleware/auth";
import { checkRoles } from "../middleware/check-role";

const router = Router();

router.post("/", authenticate, checkRoles(["super_admin"]), createUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.put("/:id", authenticate, checkRoles(["super_admin"]), updateUser);
router.get("/", authenticate, checkRoles(["super_admin"]), getUsers);
router.get("/:id", getUserById);
router.delete(
  "/delete/:id",
  authenticate,
  checkRoles(["super_admin"]),
  deleteUser
);

export default router;
