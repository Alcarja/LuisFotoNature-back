import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: process.env.HETZNER_ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY,
    secretAccessKey: process.env.HETZNER_SECRET_KEY,
  },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ["http://localhost:3000", "http://46.225.161.233"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function setCors() {
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: process.env.HETZNER_BUCKET,
        CORSConfiguration: corsConfig,
      }),
    );
    console.log("✅ CORS policy applied successfully");
  } catch (err) {
    console.error("❌ Failed to apply CORS policy:", err);
  }
}

setCors();
