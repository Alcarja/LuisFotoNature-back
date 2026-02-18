import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/authController.js";
import {
  adminMiddleware,
  authMiddleware,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authMiddleware, adminMiddleware, register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
