import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { comments, posts } from "../db/schema.js";
import { notifyNewComment } from "../services/email.js";

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { data } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "Missing post ID" });
    }

    const post = await db.select().from(posts).where(eq(posts.id, postId));
    if (post.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = await db
      .insert(comments)
      .values({
        postId,
        email: data.email,
        content: data.comment,
      })
      .returning();

    const postTitle = await db
      .select({ title: posts.title })
      .from(posts)
      .where(eq(posts.id, postId));

    // Fire and forget — don't await so it doesn't slow down the response
    notifyNewComment({
      postTitle: postTitle?.[0].title,
      commentEmail: data.email,
      commentContent: data.comment,
    }).catch((err) => {
      console.error("Unhandled error in notifyNewComment:", err);
    });

    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "Missing postId" });
    }

    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, parseInt(postId)));

    res.status(200).json(postComments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const allComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        email: comments.email,
        content: comments.content,
        approved: comments.approved,
        createdAt: comments.createdAt,
        postTitle: posts.title,
      })
      .from(comments)
      .leftJoin(posts, eq(comments.postId, posts.id))
      .orderBy(desc(comments.id));

    res.status(200).json(allComments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getApprovedCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "Missing postId" });
    }

    const postComments = await db
      .select()
      .from(comments)
      .where(
        and(eq(comments.postId, parseInt(postId)), eq(comments.approved, true)),
      );

    res.status(200).json(postComments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { approved } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: "Missing comment Id" });
    }

    if (approved === undefined) {
      return res.status(400).json({ error: "Missing approved field" });
    }

    const updateData = {
      approved,
      updatedAt: new Date(),
    };

    const updatedComment = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, parseInt(commentId)))
      .returning();

    if (updatedComment.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json(updatedComment[0]);
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ error: err.message });
  }
};
