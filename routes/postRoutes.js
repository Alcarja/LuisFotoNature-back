import express from "express";
import {
  createPost,
  getAllActivePosts,
  getAllPosts,
  getPostById,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/get-all-posts", getAllPosts);
router.get("/get-all-active-posts", getAllActivePosts);
router.get("/get-post-by-id/:postId", getPostById);

router.post("/create-post", createPost);

router.put("/update-post/:postId", updatePost);

export default router;
