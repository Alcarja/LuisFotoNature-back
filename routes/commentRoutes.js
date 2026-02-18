import express from "express";
import {
  createComment,
  getAllComments,
  getApprovedCommentsByPostId,
  getCommentsByPostId,
  updateComment,
} from "../controllers/commentController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-comment/:postId", createComment);

router.get(
  "/get-comments-by-post-id/:postId",
  authMiddleware,
  adminMiddleware,
  getCommentsByPostId,
);

router.get(
  "/get-all-comments",
  authMiddleware,
  adminMiddleware,
  getAllComments,
);

router.get(
  "/get-approved-comments-by-post-id/:postId",
  getApprovedCommentsByPostId,
);

router.put(
  "/update-comment/:commentId",
  authMiddleware,
  adminMiddleware,
  updateComment,
);

export default router;
