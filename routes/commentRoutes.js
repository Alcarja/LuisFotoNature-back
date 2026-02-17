import express from "express";
import {
  createComment,
  getApprovedCommentsByPostId,
  getCommentsByPostId,
  updateComment,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/create-comment/:postId", createComment);

router.get("/get-comments-by-post-id/:postId", getCommentsByPostId);
router.get(
  "/get-approved-comments-by-post-id/:postId",
  getApprovedCommentsByPostId,
);

router.put("/update-comment/:commentId", updateComment);

export default router;
