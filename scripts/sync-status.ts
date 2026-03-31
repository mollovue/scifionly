/**
 * Sync status checker.
 * Prints last sync info and current database counts.
 *
 * Usage:
 *   npx tsx scripts/sync-status.ts
 */

import sqlite from "./db.js";

function fmt(value: unknown): string {
  return value !== null && value !== undefined ? String(value) : "(none)";
}

function main() {
  const syncState = sqlite
    .prepare("SELECT * FROM sync_state WHERE id = 1")
    .get() as {
      last_sync_date: string | null;
      last_sync_type: string | null;
      total_movies: number | null;
      total_tv_series: number | null;
      last_change_date: string | null;
      updated_at: string | null;
    } | undefined;

  const movieCount = (
    sqlite.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number }
  ).c;
  const tvCount = (
    sqlite.prepare("SELECT COUNT(*) as c FROM tv_series").get() as { c: number }
  ).c;
  const peopleCount = (
    sqlite.prepare("SELECT COUNT(*) as c FROM people").get() as { c: number }
  ).c;
  const keywordCount = (
    sqlite.prepare("SELECT COUNT(*) as c FROM keywords").get() as { c: number }
  ).c;
  const genreCount = (
    sqlite.prepare("SELECT COUNT(*) as c FROM genres").get() as { c: number }
  ).c;

  console.log("");
  console.log("╔════════════════════════════════════════╗");
  console.log("║        SciFi Only — Sync Status        ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  if (!syncState) {
    console.log("  ⚠  No sync state found — database has not been synced yet.");
    console.log("     Run: npx tsx scripts/sync-initial.ts");
  } else {
    console.log("  Sync State:");
    console.log(`    Last sync date   : ${fmt(syncState.last_sync_date)}`);
    console.log(`    Last sync type   : ${fmt(syncState.last_sync_type)}`);
    console.log(`    Last change date : ${fmt(syncState.last_change_date)}`);
    console.log(`    State updated at : ${fmt(syncState.updated_at)}`);
    console.log(`    Tracked movies   : ${fmt(syncState.total_movies)}`);
    console.log(`    Tracked TV series: ${fmt(syncState.total_tv_series)}`);
  }

  console.log("");
  console.log("  Database Counts:");
  console.log(`    Movies      : ${movieCount}`);
  console.log(`    TV Series   : ${tvCount}`);
  console.log(`    People      : ${peopleCount}`);
  console.log(`    Keywords    : ${keywordCount}`);
  console.log(`    Genres      : ${genreCount}`);
  console.log("");

  // Show top 5 most popular movies as a sanity check
  const topMovies = sqlite
    .prepare(
      "SELECT title, release_date, vote_average, popularity FROM movies ORDER BY popularity DESC LIMIT 5"
    )
    .all() as Array<{
      title: string;
      release_date: string | null;
      vote_average: number | null;
      popularity: number | null;
    }>;

  if (topMovies.length > 0) {
    console.log("  Top 5 Movies by Popularity:");
    for (const m of topMovies) {
      const year = m.release_date?.slice(0, 4) ?? "??";
      const rating = m.vote_average?.toFixed(1) ?? "?";
      console.log(`    [${year}] ${m.title} (★${rating}, pop=${m.popularity?.toFixed(1)})`);
    }
    console.log("");
  }

  // Show top 5 TV series
  const topTv = sqlite
    .prepare(
      "SELECT name, first_air_date, vote_average, popularity FROM tv_series ORDER BY popularity DESC LIMIT 5"
    )
    .all() as Array<{
      name: string;
      first_air_date: string | null;
      vote_average: number | null;
      popularity: number | null;
    }>;

  if (topTv.length > 0) {
    console.log("  Top 5 TV Series by Popularity:");
    for (const t of topTv) {
      const year = t.first_air_date?.slice(0, 4) ?? "??";
      const rating = t.vote_average?.toFixed(1) ?? "?";
      console.log(`    [${year}] ${t.name} (★${rating}, pop=${t.popularity?.toFixed(1)})`);
    }
    console.log("");
  }

  // Recent sync health check
  if (syncState?.last_change_date) {
    const today = new Date().toISOString().slice(0, 10);
    const lastChange = syncState.last_change_date;
    const daysAgo = Math.round(
      (new Date(today).getTime() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysAgo === 0) {
      console.log("  ✓ Sync is up to date (synced today)");
    } else if (daysAgo <= 2) {
      console.log(`  ✓ Sync is recent (${daysAgo} day(s) ago)`);
    } else if (daysAgo <= 7) {
      console.log(`  ⚠ Sync may be stale (${daysAgo} days since last change date)`);
    } else {
      console.log(`  ✗ Sync is outdated! (${daysAgo} days since last change date)`);
      console.log("    Run: npx tsx scripts/sync-incremental.ts");
    }
    console.log("");
  }
}

main();
