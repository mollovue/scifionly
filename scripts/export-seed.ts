/**
 * Export the current database as compressed seed data.
 *
 * Usage:
 *   npx tsx scripts/export-seed.ts
 *
 * Creates data/seed/scifionly-seed.db.gz from the current data/scifionly.db.
 */

import fs from "fs";
import path from "path";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";

const dataDir = path.join(process.cwd(), "data");
const seedDir = path.join(dataDir, "seed");
const dbPath = path.join(dataDir, "scifionly.db");
const seedPath = path.join(seedDir, "scifionly-seed.db.gz");

async function main() {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    console.error("Run the initial sync first: npx tsx scripts/sync-initial.ts");
    process.exit(1);
  }

  // Ensure seed directory exists
  fs.mkdirSync(seedDir, { recursive: true });

  const dbStats = fs.statSync(dbPath);
  console.log(`Source database: ${(dbStats.size / (1024 * 1024)).toFixed(1)} MB`);

  // Compress the database file
  console.log("Compressing...");
  const source = fs.createReadStream(dbPath);
  const gzip = createGzip({ level: 9 });
  const destination = fs.createWriteStream(seedPath);

  await pipeline(source, gzip, destination);

  const seedStats = fs.statSync(seedPath);
  const ratio = ((1 - seedStats.size / dbStats.size) * 100).toFixed(1);
  console.log(`Seed data: ${(seedStats.size / (1024 * 1024)).toFixed(1)} MB (${ratio}% compression)`);
  console.log(`Saved to: ${seedPath}`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
