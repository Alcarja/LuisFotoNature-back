import { S3Client, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

const s3 = new S3Client({
  region: 'eu-central-1',
  endpoint: process.env.HETZNER_ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY,
    secretAccessKey: process.env.HETZNER_SECRET_KEY,
  },
});

async function getCors() {
  try {
    const response = await s3.send(new GetBucketCorsCommand({
      Bucket: process.env.HETZNER_BUCKET,
    }));
    console.log('✅ CORS policy:', JSON.stringify(response.CORSRules, null, 2));
  } catch (err) {
    console.error('❌ Failed to get CORS policy:', err);
  }
}

getCors();
