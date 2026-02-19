import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { posts } from "../db/schema.js";

export const sendPostCampaignEmail = async (req, res) => {
  try {
    const { postId } = req.params;

    // 1. Fetch the post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.campaignSent) {
      return res
        .status(400)
        .json({ error: "Campaign already sent for this post" });
    }

    // 2. Create the campaign
    const createResponse = await fetch(
      "https://api.brevo.com/v3/emailCampaigns",
      {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Post ${post.id}`,
          subject: post.title,
          sender: {
            name: "LuisFotoNature",
            email: process.env.SENDER_EMAIL,
          },
          type: "classic",
          templateId: 8,
          recipients: {
            listIds: [6],
          },
          params: {
            postTitle: post.title,
            postUrl: `${process.env.FRONTEND_URL}/posts/${post.id}`,
            featuredImage: post.featuredImage,
          },
        }),
      },
    );

    const campaignData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(campaignData.message);
    }

    const campaignId = campaignData.id;

    // 3. Send the campaign
    const sendResponse = await fetch(
      `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
      {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!sendResponse.ok) {
      const text = await sendResponse.text(); // use text() not json()
      throw new Error(text);
    }

    // 4. Mark campaign as sent
    await db
      .update(posts)
      .set({ campaignSent: true, updatedAt: new Date() })
      .where(eq(posts.id, parseInt(postId)));

    res.status(200).json({ message: "Campaign sent", campaignId });
  } catch (err) {
    console.error("Send campaign error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllSuscribers = async (req, res) => {
  try {
    const response = await fetch(
      "https://api.brevo.com/v3/contacts/lists/6/contacts?limit=500",
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
