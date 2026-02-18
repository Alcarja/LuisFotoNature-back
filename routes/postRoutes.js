import express from "express";
import {
  createPost,
  getAllActivePosts,
  getAllPosts,
  getPostById,
  updatePost,
} from "../controllers/postController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/get-all-posts", authMiddleware, adminMiddleware, getAllPosts);
router.get("/get-all-active-posts", getAllActivePosts);
router.get("/get-post-by-id/:postId", getPostById);

router.post("/create-post", authMiddleware, adminMiddleware, createPost);

router.put("/update-post/:postId", authMiddleware, adminMiddleware, updatePost);

export default router;
