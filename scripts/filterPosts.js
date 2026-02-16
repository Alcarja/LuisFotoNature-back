import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const INPUT_FILE = path.resolve(__dirname, "../../../wprnfr_posts.sql");
const OUTPUT_FILE = path.resolve(
  __dirname,
  "../filteredPosts/filtered-posts.json",
);

// Add the post IDs you want to migrate here
const POST_IDS = [
  242, 2396 /* 5 Grandes */, 373 /* Rino */, 535 /* Gorila */,
  636 /* Kamchatka */, 707, 802, 874, 947, 999, 1031, 1063 /* Hawaii */, 1107,
  1133, 1200, 1267 /* León */, 1342, 1374 /* Laponia */, 1430, 1619,
  4459 /* chile */, 4458, 4455, 4630 /* rio perdido */, 4628, 4625, 4440,
  4622 /* Nueva Zelanda */, 4619, 4610, 4608 /* Chile */, 4419,
  4718 /* Rapa Nui */, 4761 /* Churchill */, 4684, 4753 /* Antártida */, 4783,
  4811, 4837 /* Alaska */, 4869, 4893, 4899, 4938,
  // ... add more IDs
];

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseWordPressSql(sql) {
  const posts = [];

  // Find the INSERT block
  const startIndex = sql.indexOf("INSERT INTO `wprnfr_posts`");
  if (startIndex === -1) {
    throw new Error("Could not find wprnfr_posts INSERT block in SQL file");
  }

  const insertBlock = sql.slice(startIndex);

  // Extract column names
  const columnsMatch = insertBlock.match(
    /\((`[^`]+`(?:,\s*`[^`]+`)*)\)\s*VALUES/,
  );
  if (!columnsMatch) {
    throw new Error("Could not parse column names");
  }

  const columns = columnsMatch[1]
    .split(",")
    .map((c) => c.trim().replace(/`/g, ""));

  // Get everything after VALUES
  const valuesStart = insertBlock.indexOf("VALUES") + 6;
  const valuesSection = insertBlock.slice(valuesStart).trim();

  // Split into individual row strings
  const rows = splitSqlRows(valuesSection);
  console.log(`   Parsed ${rows.length} rows from INSERT block`);

  for (const row of rows) {
    const values = parseSqlRow(row);
    if (!values || values.length !== columns.length) continue;

    const post = {};
    columns.forEach((col, i) => {
      post[col] = values[i];
    });

    posts.push(post);
  }

  return posts;
}

/**
 * Splits the VALUES section into individual row strings.
 * Handles nested parentheses and quoted strings safely.
 */
function splitSqlRows(valuesSection) {
  const rows = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === "'" && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "(") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === ")") {
      depth--;
      if (depth === 0 && start !== -1) {
        rows.push(valuesSection.slice(start + 1, i));
        start = -1;
      }
    }
  }

  return rows;
}

/**
 * Parses a single SQL row string into an array of values.
 * Handles quoted strings, NULLs, and escaped characters.
 */
function parseSqlRow(row) {
  const values = [];
  let i = 0;

  while (i < row.length) {
    // Skip whitespace and commas between values
    while (
      i < row.length &&
      (row[i] === "," || row[i] === " " || row[i] === "\n" || row[i] === "\r")
    )
      i++;
    if (i >= row.length) break;

    if (row[i] === "'") {
      // Quoted string value
      let value = "";
      i++; // skip opening quote

      while (i < row.length) {
        if (row[i] === "\\") {
          i++;
          const escapeMap = {
            n: "\n",
            t: "\t",
            r: "\r",
            "'": "'",
            "\\": "\\",
            '"': '"',
          };
          value += escapeMap[row[i]] !== undefined ? escapeMap[row[i]] : row[i];
        } else if (row[i] === "'") {
          i++; // skip closing quote
          break;
        } else {
          value += row[i];
        }
        i++;
      }
      values.push(value);
    } else if (row.slice(i, i + 4).toUpperCase() === "NULL") {
      values.push(null);
      i += 4;
    } else {
      // Numeric or unquoted value
      let value = "";
      while (i < row.length && row[i] !== ",") {
        value += row[i];
        i++;
      }
      values.push(value.trim());
    }
  }

  return values;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`📂 Reading SQL file: ${INPUT_FILE}`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ File not found: ${INPUT_FILE}`);
    console.error("   Update INPUT_FILE path at the top of the script.");
    process.exit(1);
  }

  const sql = fs.readFileSync(INPUT_FILE, "utf-8");
  console.log(`✅ File loaded (${(sql.length / 1024 / 1024).toFixed(2)} MB)\n`);

  console.log("🔍 Parsing posts...");
  const allPosts = parseWordPressSql(sql);
  console.log(`   Found ${allPosts.length} total posts\n`);

  // Filter to only the IDs we want
  const filtered = allPosts.filter((p) => POST_IDS.includes(Number(p.ID)));

  console.log(
    `✅ Matched ${filtered.length} of ${POST_IDS.length} requested IDs`,
  );

  // Warn about any IDs that weren't found
  const foundIds = filtered.map((p) => Number(p.ID));
  const missingIds = POST_IDS.filter((id) => !foundIds.includes(id));
  if (missingIds.length > 0) {
    console.warn(`⚠  Could not find IDs: ${missingIds.join(", ")}`);
  }

  // Save filtered posts to JSON
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2), "utf-8");

  console.log(`\n📄 Saved to: ${OUTPUT_FILE}`);
  console.log("\nPosts found:");
  filtered.forEach((p) =>
    console.log(`  [${p.ID}] ${p.post_title} (${p.post_status})`),
  );
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
