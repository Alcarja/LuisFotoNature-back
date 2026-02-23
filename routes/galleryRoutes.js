import express from "express";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware.js";
import {
  createGallery,
  createGalleryImage,
  getAllGalleries,
  getGalleryById,
  getGalleryImagesByGalleryId,
  updateGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

router.post("/create-gallery/", createGallery);

router.post("/create-gallery-image/", createGalleryImage);

router.get(
  "/get-gallery-by-id/:galleryId",
  authMiddleware,
  adminMiddleware,
  getGalleryById,
);

router.get(
  "/get-gallery-by-id/:galleryId",
  authMiddleware,
  adminMiddleware,
  getGalleryById,
);

router.get(
  "/get-all-galleries",
  authMiddleware,
  adminMiddleware,
  getAllGalleries,
);

router.get("/get-all-active-galleries", getAllGalleries);

router.put(
  "/update-gallery/:galleryId",
  authMiddleware,
  adminMiddleware,
  updateGallery,
);

router.get(
  "/get-gallery-images-by-gallery-id/:galleryId",
  getGalleryImagesByGalleryId,
);

export default router;
