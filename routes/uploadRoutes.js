import express from "express";
import { getPresignedUrl, confirmImageUpload, deleteUploadedImages } from "../controllers/uploadController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/presign", authMiddleware, adminMiddleware, getPresignedUrl);
router.post("/confirm", authMiddleware, adminMiddleware, confirmImageUpload);
router.post("/delete-images", authMiddleware, adminMiddleware, deleteUploadedImages);

export default router;
