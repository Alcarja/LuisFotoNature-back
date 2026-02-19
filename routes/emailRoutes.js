import express from "express";
import {
  getAllSuscribers,
  sendPostCampaignEmail,
} from "../controllers/emailController.js";

const router = express.Router();

router.post("/send-post-campaign/:postId", sendPostCampaignEmail);

router.get("/get-all-subscribers", getAllSuscribers);

export default router;
