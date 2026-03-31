/**
 * Vitest global test setup.
 *
 * Seeds the database with demo data before all tests run.
 * The DatabaseStorage class creates its own DB connection at
 * data/scifionly.db; tests share that same DB.
 */

import { beforeAll } from "vitest";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

// ─────────────────────────────────────────────
// Seed test data before all tests
// ─────────────────────────────────────────────

beforeAll(async () => {
  // Open the same database the storage module will use
  const sqlite = new Database(path.join(dataDir, "scifionly.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Import and run the seed (uses the db.ts instance which opens same file)
  const { runSeed } = await import("../scripts/seed-demo.js");
  runSeed(sqlite);
  sqlite.close();
}, 60_000);
