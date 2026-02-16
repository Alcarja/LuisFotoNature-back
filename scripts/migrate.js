import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import pg from "pg";
import slugify from "slugify";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Config ──────────────────────────────────────────────────────────────────

const FILTERED_POSTS_FILE = path.resolve(__dirname, "../test-post.json");
const LOCAL_IMAGES_DIR = path.resolve(
  __dirname,
  "../../../../FotosLuisFotoNature",
);
const OWNER_ID = 1; // Your user ID in the new DB

// ─── Clients ─────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: process.env.HETZNER_ENDPOINT,
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY,
    secretAccessKey: process.env.HETZNER_SECRET_KEY,
  },
});

const neon = new pg.Client({ connectionString: process.env.DATABASE_URL });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts a WordPress URL filename to a local filename.
 * e.g. "Petropavlovsk-5.jpg" → "Petropavlovsk 5.jpg"
 */
function urlFilenameToLocal(urlFilename) {
  return decodeURIComponent(urlFilename).replace(/-/g, " ");
}

/**
 * Finds a local image file by trying different name variations.
 * Returns the full path if found, null if not.
 */
function findLocalImage(urlFilename) {
  const candidates = [
    urlFilename,
    urlFilenameToLocal(urlFilename),
    urlFilename.toLowerCase(),
    urlFilenameToLocal(urlFilename).toLowerCase(),
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(LOCAL_IMAGES_DIR, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Uploads a local image file to Hetzner and returns the public URL.
 */
async function uploadImageToHetzner(localPath, originalFilename, postId) {
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(originalFilename).toLowerCase();

  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  const contentType = mimeTypes[ext] || "image/jpeg";

  const key = `photos/${postId}/${originalFilename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.HETZNER_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return `${process.env.HETZNER_ENDPOINT}/${process.env.HETZNER_BUCKET}/${key}`;
}

/**
 * Processes post HTML:
 * - Finds all img tags
 * - Looks up the image locally
 * - Uploads to Hetzner
 * - Replaces src with new Hetzner URL
 * - Cleans up WordPress-specific attributes
 * Returns { processedHtml, featuredImage }
 */
async function processContent(html, postId) {
  const $ = cheerio.load(html, { decodeEntities: false });
  const imgTags = $("img").toArray();

  let featuredImage = null;
  let isFirst = true;

  for (const el of imgTags) {
    const img = $(el);
    const src = img.attr("src");
    if (!src) continue;

    const urlFilename = src.split("/").pop().split("?")[0];
    const localPath = findLocalImage(urlFilename);

    if (localPath) {
      console.log(`    ✅ Found locally: ${urlFilename}`);
      const newUrl = await uploadImageToHetzner(localPath, urlFilename, postId);
      img.attr("src", newUrl);
      console.log(`    ☁️  Uploaded: ${newUrl}`);

      if (isFirst) {
        featuredImage = newUrl;
        isFirst = false;
      }
    } else {
      console.warn(
        `    ⚠️  Not found locally: ${urlFilename} — keeping original URL`,
      );
    }

    img.removeAttr("srcset");
    img.removeAttr("sizes");
    img.removeAttr("loading");
    img.removeAttr("width");
    img.removeAttr("height");
    img.removeAttr("class");
  }

  return {
    processedHtml: $("body").html(),
    featuredImage,
  };
}

/**
 * Generates a unique slug, appending a number if it already exists.
 */
async function generateSlug(title, existingSlug) {
  const base = existingSlug || slugify(title, { lower: true, strict: true });

  const result = await neon.query("SELECT slug FROM posts WHERE slug LIKE $1", [
    `${base}%`,
  ]);

  if (result.rows.length === 0) return base;
  return `${base}-${result.rows.length + 1}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  console.log("🚀 Starting migration...\n");

  if (!fs.existsSync(FILTERED_POSTS_FILE)) {
    console.error(`❌ Filtered posts file not found: ${FILTERED_POSTS_FILE}`);
    console.error("   Run filter-posts.js first.");
    process.exit(1);
  }

  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${LOCAL_IMAGES_DIR}`);
    console.error(
      '   Create an "images" folder in your backend root and dump all images there.',
    );
    process.exit(1);
  }

  await neon.connect();
  console.log("✅ Connected to Neon\n");

  const posts = JSON.parse(fs.readFileSync(FILTERED_POSTS_FILE, "utf-8"));
  console.log(`📋 Found ${posts.length} posts to migrate\n`);

  let successCount = 0;
  let failCount = 0;

  for (const [index, post] of posts.entries()) {
    console.log(`\n[${index + 1}/${posts.length}] "${post.post_title}"`);

    try {
      // 1. Insert the post first to get the new ID
      const slug = await generateSlug(post.post_title, post.post_name);

      const insertResult = await neon.query(
        `INSERT INTO posts 
          (title, content, featured_image, owner, slug, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          post.post_title,
          "", // temporary empty content
          null, // temporary null featured image
          OWNER_ID,
          slug,
          false,
          new Date(post.post_date),
          new Date(post.post_modified),
        ],
      );

      if (insertResult.rows.length === 0) {
        console.warn(`  ⚠️  Skipped (slug already exists): ${slug}`);
        continue;
      }

      const newId = insertResult.rows[0].id;
      console.log(`  📝 Created post with new ID: ${newId}`);

      // 2. Now process images using the new ID as the folder
      console.log("  🖼  Processing images...");
      const { processedHtml, featuredImage } = await processContent(
        post.post_content,
        newId,
      );

      // 3. Update the post with the real content and featured image
      await neon.query(
        `UPDATE posts SET content = $1, featured_image = $2 WHERE id = $3`,
        [processedHtml, featuredImage, newId],
      );

      console.log(`  ✅ Inserted as draft (slug: ${slug})`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failCount++;
    }
  }

  console.log("\n─────────────────────────────────");
  console.log("Migration complete!");
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed:     ${failCount}`);
  console.log("─────────────────────────────────\n");

  await neon.end();
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
