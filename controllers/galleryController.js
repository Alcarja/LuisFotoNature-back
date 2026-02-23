import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { galleries, galleryImages } from "../db/schema.js";

export const createGallery = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(500).json("Missing Gallery data");
    }

    const newGallery = await db
      .insert(galleries)
      .values({
        userId: data.userId,
        name: data.name,
        continent: data.continent,
        place: data.place,
        active: false,
      })
      .returning();

    res.status(201).json(newGallery);
  } catch (err) {
    console.error("Create gallery error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createGalleryImage = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(500).json("Missing Gallery image data");
    }

    console.log("REQ:BODY", req.body);

    const newGalleryImage = await db
      .insert(galleryImages)
      .values({
        galleryId: data.galleryId,
        imageUrl: data.url,
      })
      .returning();

    res.status(201).json(newGalleryImage);
  } catch (err) {
    console.error("Create gallery image error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getGalleryById = async (req, res) => {
  try {
    const { galleryId } = req.params;

    if (!galleryId) {
      return res.status(400).json({ error: "Missing galleryId" });
    }

    const gallery = await db
      .select()
      .from(galleries)
      .where(eq(galleries.id, parseInt(galleryId)));

    res.status(200).json(gallery);
  } catch (err) {
    console.error("Get gallery error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllGalleries = async (req, res) => {
  try {
    const allGalleries = await db
      .select({
        id: galleries.id,
        userId: galleries.userId,
        name: galleries.name,
        continent: galleries.continent,
        place: galleries.place,
        active: galleries.active,
        createdAt: galleries.createdAt,
      })
      .from(galleries)
      .orderBy(desc(galleries.createdAt));

    res.status(200).json(allGalleries);
  } catch (err) {
    console.error("Get galleries error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllActiveGalleries = async (req, res) => {
  try {
    const allActiveGalleries = await db
      .select({
        id: galleries.id,
        userId: galleries.userId,
        name: galleries.name,
        continent: galleries.continent,
        place: galleries.place,
        createdAt: galleries.createdAt,
      })
      .from(galleries)
      .where(eq(galleries.active, "active"))
      .orderBy(desc(galleries.createdAt));

    res.status(200).json(allActiveGalleries);
  } catch (err) {
    console.error("Get all active galleries error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateGallery = async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { data } = req.body;

    if (!galleryId) {
      return res.status(400).json({ error: "Missing galleryId" });
    }

    if (!data) {
      return res.status(400).json({ error: "Missing gallery data" });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.continent !== undefined) updateData.continent = data.continent;
    if (data.place !== undefined) updateData.place = data.place;
    if (data.active !== undefined) updateData.active = data.active;

    const updatedGallery = await db
      .update(galleries)
      .set(updateData)
      .where(eq(galleries.id, parseInt(galleryId)))
      .returning();

    if (updatedGallery.length === 0) {
      return res.status(404).json({ error: "Gallery not found" });
    }

    res.status(200).json(updatedGallery[0]);
  } catch (err) {
    console.error("Update gallery error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getGalleryImagesByGalleryId = async (req, res) => {
  try {
    const { galleryId } = req.params;

    if (!galleryId) {
      return res.status(400).json({ error: "Missing galleryId" });
    }

    const galleryContent = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.galleryId, parseInt(galleryId)));

    res.status(200).json(galleryContent);
  } catch (err) {
    console.error("Get gallery images error:", err);
    res.status(500).json({ error: err.message });
  }
};
