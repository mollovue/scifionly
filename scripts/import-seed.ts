/**
 * Import seed data into the database.
 *
 * Usage:
 *   npx tsx scripts/import-seed.ts
 *   npx tsx scripts/import-seed.ts --force   # overwrite existing data
 *
 * Decompresses data/seed/scifionly-seed.db.gz and replaces data/scifionly.db.
 * Only runs if the database is empty or --force is specified.
 */

import fs from "fs";
import path from "path";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import Database from "better-sqlite3";

const forceImport = process.argv.includes("--force");

const dataDir = path.join(process.cwd(), "data");
const seedPath = path.join(dataDir, "seed", "scifionly-seed.db.gz");
const dbPath = path.join(dataDir, "scifionly.db");

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Seed data not found at ${seedPath}`);
    process.exit(1);
  }

  // Check if DB already has data
  if (fs.existsSync(dbPath) && !forceImport) {
    try {
      const db = new Database(dbPath);
      const result = db.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number };
      db.close();
      if (result.c > 0) {
        console.log(`Database already has ${result.c} movies. Use --force to overwrite.`);
        return;
      }
    } catch {
      // DB exists but schema missing — will overwrite
    }
  }

  // Ensure data directory exists
  fs.mkdirSync(dataDir, { recursive: true });

  // Remove existing DB files
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const f = dbPath + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  // Decompress seed data
  const seedStats = fs.statSync(seedPath);
  console.log(`Decompressing seed data (${(seedStats.size / (1024 * 1024)).toFixed(1)} MB)...`);

  const source = fs.createReadStream(seedPath);
  const gunzip = createGunzip();
  const destination = fs.createWriteStream(dbPath);

  await pipeline(source, gunzip, destination);

  const dbStats = fs.statSync(dbPath);
  console.log(`Database restored: ${(dbStats.size / (1024 * 1024)).toFixed(1)} MB`);

  // Verify
  const db = new Database(dbPath);
  const movies = (db.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number }).c;
  const tv = (db.prepare("SELECT COUNT(*) as c FROM tv_series").get() as { c: number }).c;
  db.close();

  console.log(`Verified: ${movies} movies, ${tv} TV series`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
