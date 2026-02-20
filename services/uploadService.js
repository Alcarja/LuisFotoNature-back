import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-central",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: false,
});

const PRESIGN_EXPIRY = 5 * 60; // 5 minutes in seconds
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL;

export const generatePresignedUrl = async (filename, contentType, postId, galleryId) => {
  try {
    const uniqueId = crypto.randomBytes(4).toString("hex");
    let folderPath;
    if (galleryId) {
      folderPath = `galleries/${galleryId}`;
    } else if (postId) {
      folderPath = `photos/post-${postId}`;
    } else {
      folderPath = `photos/temp`;
    }
    const key = `${folderPath}/${uniqueId}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRY,
    });

    const publicUrl = `${PUBLIC_BASE_URL}/${key}`;

    return {
      presignedUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
};

export const confirmUpload = async (publicUrl, filename, contentType, context) => {
  try {
    // The file has already been uploaded directly to S3 via the presigned URL
    // This endpoint confirms the upload and can be used for tracking if needed

    return {
      success: true,
      imageUrl: publicUrl,
      context,
      filename,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error confirming upload:", error);
    throw new Error("Failed to confirm upload");
  }
};

export const deleteImages = async (imageUrls) => {
  try {
    const results = {
      success: true,
      deleted: 0,
      failed: 0,
      errors: [],
    };

    for (const url of imageUrls) {
      try {
        // Extract the key from the URL
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash

        console.log(`Deleting S3 object: ${key}`);

        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        await s3Client.send(command);
        console.log(`✓ Successfully deleted: ${key}`);
        results.deleted++;
      } catch (error) {
        console.error(`✗ Error deleting ${url}:`, error);
        results.failed++;
        results.errors.push({
          url,
          error: error.message,
        });
      }
    }

    console.log(`Deletion summary: ${results.deleted} deleted, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error("Error in deleteImages:", error);
    throw new Error("Failed to delete images");
  }
};
