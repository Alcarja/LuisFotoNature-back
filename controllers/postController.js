import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { posts } from "../db/schema.js";
import { deleteImages } from "../services/uploadService.js";

export const createPost = async (req, res) => {
  try {
    const { postData } = req.body;

    if (!postData?.title) {
      return res.status(400).json({ error: "Missing post title" });
    }

    if (!postData?.userId) {
      return res.status(401).json({ error: "Unauthorized - no user ID" });
    }

    const newPost = await db
      .insert(posts)
      .values({
        title: postData.title,
        category: postData.category || null,
        content: postData.content || "",
        featuredImage: postData.featuredImage || null,
        owner: postData.userId,
      })
      .returning();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: posts.createdAt,
        category: posts.category,
        active: posts.active,
      })
      .from(posts);

    res.status(200).json(allPosts);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllActivePosts = async (req, res) => {
  try {
    const allActivePosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: posts.createdAt,
        category: posts.category,
        featuredImage: posts.featuredImage,
      })
      .from(posts)
      .where(eq(posts.active, true))
      .orderBy(desc(posts.createdAt));

    res.status(200).json(allActivePosts);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(500).json("Missing post Id");
    }

    const postInfo = await db
      .select({
        id: posts.id,
        title: posts.title,
        featuredImage: posts.featuredImage,
        content: posts.content,
        owner: posts.owner,
        category: posts.category,
        active: posts.active,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.id, postId));

    res.status(200).json(postInfo);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { postData, imageUrlsToDelete } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "Missing post ID" });
    }

    if (!postData?.title) {
      return res.status(400).json({ error: "Missing post title" });
    }

    // Images are organized by post ID in folder: photos/post-{postId}/
    // No reorganization needed - they're already in the correct location
    const updatedContent = postData.content || "";

    const updateData = {
      title: postData.title,
      content: updatedContent,
      category: postData.category || null,
      featuredImage: postData.featuredImage || null,
      updatedAt: new Date(),
    };

    const updatedPost = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, parseInt(postId)))
      .returning();

    // Delete removed images from S3 (non-blocking, doesn't fail the post update)
    if (
      imageUrlsToDelete &&
      Array.isArray(imageUrlsToDelete) &&
      imageUrlsToDelete.length > 0
    ) {
      console.log("🔄 Starting image deletion...", imageUrlsToDelete);
      deleteImages(imageUrlsToDelete)
        .then((result) => {
          console.log("✅ Image deletion completed:", result);
        })
        .catch((err) => {
          console.error("❌ Error deleting images:", err);
          // Don't throw - this shouldn't block the post update
        });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: err.message });
  }
};
