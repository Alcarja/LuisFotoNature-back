import express from "express";
import {
  getAllSuscribers,
  sendPostCampaignEmail,
} from "../controllers/emailController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/send-post-campaign/:postId",
  authMiddleware,
  adminMiddleware,
  sendPostCampaignEmail,
);

router.get(
  "/get-all-subscribers",
  authMiddleware,
  adminMiddleware,
  getAllSuscribers,
);

export default router;
