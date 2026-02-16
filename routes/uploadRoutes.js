import express from "express";
import { getPresignedUrl, confirmImageUpload, deleteUploadedImages } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/presign", getPresignedUrl);
router.post("/confirm", confirmImageUpload);
router.post("/delete-images", deleteUploadedImages);

export default router;
