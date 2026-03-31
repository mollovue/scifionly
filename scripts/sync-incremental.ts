/**
 * Daily incremental sync script.
 *
 * Usage:
 *   npx tsx scripts/sync-incremental.ts
 *   npx tsx scripts/sync-incremental.ts --dry-run   # no DB writes
 *
 * Strategy:
 *   1. Read last_change_date from sync_state
 *   2. Set start_date = last_change_date, end_date = today UTC
 *   3. Split into ≤14-day chunks if range exceeds 14 days
 *   4. Fetch changed movie + TV IDs via /changes endpoints
 *   5. For each changed ID: fetch details, check if sci-fi
 *   6. Upsert sci-fi entries, remove non-sci-fi entries that exist in DB
 *   7. Update sync_state
 */

import sqlite from "./db.js";
import {
  getMovieDetails,
  getTVDetails,
  getMovieChanges,
  getTVChanges,
  paginateAll,
  type TmdbMovieDetails,
  type TmdbTvDetails,
  type TmdbPerson,
} from "./tmdb-client.js";

// ─────────────────────────────────────────────
// CLI flags
// ─────────────────────────────────────────────

const isDryRun = process.argv.includes("--dry-run");

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const SCIFI_MOVIE_GENRE = 878;
const SCIFI_TV_GENRE = 10765;
const MAX_CHANGE_WINDOW_DAYS = 14;

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, meta?: object) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    dry_run: isDryRun,
    ...(meta ? meta : {}),
  };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Split a date range into chunks of at most maxDays days.
 * Returns array of [startDate, endDate] tuples (inclusive).
 */
function splitDateRange(
  startDate: string,
  endDate: string,
  maxDays: number
): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  let current = startDate;

  while (current < endDate) {
    const chunkEnd = addDays(current, maxDays);
    chunks.push([current, chunkEnd > endDate ? endDate : chunkEnd]);
    current = addDays(current, maxDays);
    if (current >= endDate) break;
  }

  return chunks;
}

// ─────────────────────────────────────────────
// Prepared statements (reuse from sync-initial logic)
// ─────────────────────────────────────────────

const stmts = {
  getSyncState: sqlite.prepare(`SELECT * FROM sync_state WHERE id = 1`),

  upsertGenre: sqlite.prepare(`INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)`),

  upsertPerson: sqlite.prepare(`
    INSERT INTO people(tmdb_id, name, profile_path, known_for_department)
    VALUES (@tmdb_id, @name, @profile_path, @known_for_department)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      name = excluded.name,
      profile_path = excluded.profile_path,
      known_for_department = excluded.known_for_department
  `),

  upsertKeyword: sqlite.prepare(`INSERT OR REPLACE INTO keywords(id, name) VALUES (?, ?)`),

  upsertCompany: sqlite.prepare(`
    INSERT OR REPLACE INTO production_companies(id, name, logo_path, origin_country)
    VALUES (@id, @name, @logo_path, @origin_country)
  `),

  upsertMovie: sqlite.prepare(`
    INSERT INTO movies(
      tmdb_id, title, original_title, overview, poster_path, backdrop_path,
      release_date, status, runtime, vote_average, vote_count, popularity,
      budget, revenue, original_language, spoken_languages, tagline,
      homepage, imdb_id, tmdb_updated_at, updated_at
    ) VALUES (
      @tmdb_id, @title, @original_title, @overview, @poster_path, @backdrop_path,
      @release_date, @status, @runtime, @vote_average, @vote_count, @popularity,
      @budget, @revenue, @original_language, @spoken_languages, @tagline,
      @homepage, @imdb_id, @tmdb_updated_at, CURRENT_TIMESTAMP
    )
    ON CONFLICT(tmdb_id) DO UPDATE SET
      title = excluded.title, original_title = excluded.original_title,
      overview = excluded.overview, poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path, release_date = excluded.release_date,
      status = excluded.status, runtime = excluded.runtime,
      vote_average = excluded.vote_average, vote_count = excluded.vote_count,
      popularity = excluded.popularity, budget = excluded.budget,
      revenue = excluded.revenue, original_language = excluded.original_language,
      spoken_languages = excluded.spoken_languages, tagline = excluded.tagline,
      homepage = excluded.homepage, imdb_id = excluded.imdb_id,
      tmdb_updated_at = excluded.tmdb_updated_at, updated_at = CURRENT_TIMESTAMP
  `),

  upsertTv: sqlite.prepare(`
    INSERT INTO tv_series(
      tmdb_id, name, original_name, overview, poster_path, backdrop_path,
      first_air_date, last_air_date, status, number_of_seasons, number_of_episodes,
      episode_run_time, vote_average, vote_count, popularity, original_language,
      spoken_languages, tagline, homepage, networks, tmdb_updated_at, updated_at
    ) VALUES (
      @tmdb_id, @name, @original_name, @overview, @poster_path, @backdrop_path,
      @first_air_date, @last_air_date, @status, @number_of_seasons, @number_of_episodes,
      @episode_run_time, @vote_average, @vote_count, @popularity, @original_language,
      @spoken_languages, @tagline, @homepage, @networks, @tmdb_updated_at, CURRENT_TIMESTAMP
    )
    ON CONFLICT(tmdb_id) DO UPDATE SET
      name = excluded.name, original_name = excluded.original_name,
      overview = excluded.overview, poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path, first_air_date = excluded.first_air_date,
      last_air_date = excluded.last_air_date, status = excluded.status,
      number_of_seasons = excluded.number_of_seasons, number_of_episodes = excluded.number_of_episodes,
      episode_run_time = excluded.episode_run_time, vote_average = excluded.vote_average,
      vote_count = excluded.vote_count, popularity = excluded.popularity,
      original_language = excluded.original_language, spoken_languages = excluded.spoken_languages,
      tagline = excluded.tagline, homepage = excluded.homepage, networks = excluded.networks,
      tmdb_updated_at = excluded.tmdb_updated_at, updated_at = CURRENT_TIMESTAMP
  `),

  getMovieByTmdb: sqlite.prepare(`SELECT id FROM movies WHERE tmdb_id = ?`),
  getTvByTmdb: sqlite.prepare(`SELECT id FROM tv_series WHERE tmdb_id = ?`),
  getPersonByTmdb: sqlite.prepare(`SELECT id FROM people WHERE tmdb_id = ?`),

  deleteMovieByTmdb: sqlite.prepare(`DELETE FROM movies WHERE tmdb_id = ?`),
  deleteTvByTmdb: sqlite.prepare(`DELETE FROM tv_series WHERE tmdb_id = ?`),

  deleteMovieGenres: sqlite.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`),
  deleteMovieCast: sqlite.prepare(`DELETE FROM movie_cast WHERE movie_id = ?`),
  deleteMovieCrew: sqlite.prepare(`DELETE FROM movie_crew WHERE movie_id = ?`),
  deleteMovieKeywords: sqlite.prepare(`DELETE FROM movie_keywords WHERE movie_id = ?`),
  deleteMovieCompanies: sqlite.prepare(`DELETE FROM movie_production_companies WHERE movie_id = ?`),
  deleteTvGenres: sqlite.prepare(`DELETE FROM tv_series_genres WHERE tv_series_id = ?`),
  deleteTvCast: sqlite.prepare(`DELETE FROM tv_series_cast WHERE tv_series_id = ?`),
  deleteTvCrew: sqlite.prepare(`DELETE FROM tv_series_crew WHERE tv_series_id = ?`),

  insertMovieGenre: sqlite.prepare(`INSERT OR IGNORE INTO movie_genres(movie_id, genre_id) VALUES (?, ?)`),
  insertMovieCast: sqlite.prepare(`
    INSERT OR IGNORE INTO movie_cast(movie_id, person_id, character, display_order)
    VALUES (@movie_id, @person_id, @character, @display_order)
  `),
  insertMovieCrew: sqlite.prepare(`
    INSERT OR IGNORE INTO movie_crew(movie_id, person_id, job, department)
    VALUES (@movie_id, @person_id, @job, @department)
  `),
  insertMovieKeyword: sqlite.prepare(`INSERT OR IGNORE INTO movie_keywords(movie_id, keyword_id) VALUES (?, ?)`),
  insertMovieCompany: sqlite.prepare(`INSERT OR IGNORE INTO movie_production_companies(movie_id, company_id) VALUES (?, ?)`),
  insertTvGenre: sqlite.prepare(`INSERT OR IGNORE INTO tv_series_genres(tv_series_id, genre_id) VALUES (?, ?)`),
  insertTvCast: sqlite.prepare(`
    INSERT OR IGNORE INTO tv_series_cast(tv_series_id, person_id, character, display_order)
    VALUES (@tv_series_id, @person_id, @character, @display_order)
  `),
  insertTvCrew: sqlite.prepare(`
    INSERT OR IGNORE INTO tv_series_crew(tv_series_id, person_id, job, department)
    VALUES (@tv_series_id, @person_id, @job, @department)
  `),

  updateMovieDenorm: sqlite.prepare(`
    UPDATE movies SET
      cast_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_cast mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
      crew_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_crew mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
      keyword_names = (SELECT GROUP_CONCAT(k.name, ', ') FROM movie_keywords mk JOIN keywords k ON mk.keyword_id = k.id WHERE mk.movie_id = movies.id)
    WHERE id = ?
  `),

  updateTvDenorm: sqlite.prepare(`
    UPDATE tv_series SET
      cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_cast tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
      crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_crew tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id)
    WHERE id = ?
  `),

  upsertSyncState: sqlite.prepare(`
    INSERT INTO sync_state(id, last_sync_date, last_sync_type, total_movies, total_tv_series, last_change_date, updated_at)
    VALUES (1, @last_sync_date, @last_sync_type, @total_movies, @total_tv_series, @last_change_date, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      last_sync_date   = excluded.last_sync_date,
      last_sync_type   = excluded.last_sync_type,
      total_movies     = excluded.total_movies,
      total_tv_series  = excluded.total_tv_series,
      last_change_date = excluded.last_change_date,
      updated_at       = CURRENT_TIMESTAMP
  `),

  countMovies: sqlite.prepare(`SELECT COUNT(*) as c FROM movies`),
  countTv: sqlite.prepare(`SELECT COUNT(*) as c FROM tv_series`),
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function upsertPerson(p: TmdbPerson): number {
  stmts.upsertPerson.run({
    tmdb_id: p.id,
    name: p.name,
    profile_path: p.profile_path ?? null,
    known_for_department: p.known_for_department ?? null,
  });
  const row = stmts.getPersonByTmdb.get(p.id) as { id: number };
  return row.id;
}

const persistMovie = sqlite.transaction((data: TmdbMovieDetails) => {
  stmts.upsertMovie.run({
    tmdb_id: data.id,
    title: data.title,
    original_title: data.original_title ?? null,
    overview: data.overview ?? null,
    poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null,
    release_date: data.release_date ?? null,
    status: data.status ?? null,
    runtime: data.runtime ?? null,
    vote_average: data.vote_average ?? null,
    vote_count: data.vote_count ?? null,
    popularity: data.popularity ?? null,
    budget: data.budget ?? null,
    revenue: data.revenue ?? null,
    original_language: data.original_language ?? null,
    spoken_languages: data.spoken_languages ? JSON.stringify(data.spoken_languages.map((l) => l.iso_639_1)) : null,
    tagline: data.tagline ?? null,
    homepage: data.homepage ?? null,
    imdb_id: data.imdb_id ?? null,
    tmdb_updated_at: new Date().toISOString(),
  });

  const row = stmts.getMovieByTmdb.get(data.id) as { id: number };
  const movieId = row.id;

  for (const g of data.genres ?? []) stmts.upsertGenre.run(g.id, g.name);
  stmts.deleteMovieGenres.run(movieId);
  for (const g of data.genres ?? []) stmts.insertMovieGenre.run(movieId, g.id);

  for (const c of data.production_companies ?? []) stmts.upsertCompany.run({ id: c.id, name: c.name, logo_path: c.logo_path ?? null, origin_country: c.origin_country ?? null });
  stmts.deleteMovieCompanies.run(movieId);
  for (const c of data.production_companies ?? []) stmts.insertMovieCompany.run(movieId, c.id);

  for (const k of data.keywords?.keywords ?? []) stmts.upsertKeyword.run(k.id, k.name);
  stmts.deleteMovieKeywords.run(movieId);
  for (const k of data.keywords?.keywords ?? []) stmts.insertMovieKeyword.run(movieId, k.id);

  stmts.deleteMovieCast.run(movieId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const personId = upsertPerson(person);
    stmts.insertMovieCast.run({ movie_id: movieId, person_id: personId, character: person.character ?? null, display_order: person.order ?? null });
  }

  const relevantCrew = (data.credits?.crew ?? []).filter((c) =>
    ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"].includes(c.job ?? "")
  );
  stmts.deleteMovieCrew.run(movieId);
  for (const person of relevantCrew) {
    const personId = upsertPerson(person);
    stmts.insertMovieCrew.run({ movie_id: movieId, person_id: personId, job: person.job ?? null, department: person.department ?? null });
  }

  stmts.updateMovieDenorm.run(movieId);
});

const persistTv = sqlite.transaction((data: TmdbTvDetails) => {
  stmts.upsertTv.run({
    tmdb_id: data.id,
    name: data.name,
    original_name: data.original_name ?? null,
    overview: data.overview ?? null,
    poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null,
    first_air_date: data.first_air_date ?? null,
    last_air_date: data.last_air_date ?? null,
    status: data.status ?? null,
    number_of_seasons: data.number_of_seasons ?? null,
    number_of_episodes: data.number_of_episodes ?? null,
    episode_run_time: data.episode_run_time ? JSON.stringify(data.episode_run_time) : null,
    vote_average: data.vote_average ?? null,
    vote_count: data.vote_count ?? null,
    popularity: data.popularity ?? null,
    original_language: data.original_language ?? null,
    spoken_languages: data.spoken_languages ? JSON.stringify(data.spoken_languages.map((l) => l.iso_639_1)) : null,
    tagline: data.tagline ?? null,
    homepage: data.homepage ?? null,
    networks: data.networks ? JSON.stringify(data.networks.map((n) => n.name)) : null,
    tmdb_updated_at: new Date().toISOString(),
  });

  const row = stmts.getTvByTmdb.get(data.id) as { id: number };
  const tvId = row.id;

  for (const g of data.genres ?? []) stmts.upsertGenre.run(g.id, g.name);
  stmts.deleteTvGenres.run(tvId);
  for (const g of data.genres ?? []) stmts.insertTvGenre.run(tvId, g.id);

  stmts.deleteTvCast.run(tvId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const personId = upsertPerson(person);
    stmts.insertTvCast.run({ tv_series_id: tvId, person_id: personId, character: person.character ?? null, display_order: person.order ?? null });
  }

  const relevantCrew = (data.credits?.crew ?? []).filter((c) =>
    ["Director", "Creator", "Showrunner", "Executive Producer"].includes(c.job ?? "")
  );
  stmts.deleteTvCrew.run(tvId);
  for (const person of relevantCrew) {
    const personId = upsertPerson(person);
    stmts.insertTvCrew.run({ tv_series_id: tvId, person_id: personId, job: person.job ?? null, department: person.department ?? null });
  }

  stmts.updateTvDenorm.run(tvId);
});

// ─────────────────────────────────────────────
// Process a date range chunk
// ─────────────────────────────────────────────

async function processChunk(
  startDate: string,
  endDate: string,
  stats: { added: number; updated: number; removed: number; errors: number }
) {
  log("INFO", `Processing changes from ${startDate} to ${endDate}`);

  // Collect all changed movie IDs
  const changedMovies = await paginateAll((page) =>
    getMovieChanges(startDate, endDate, page)
  );
  log("INFO", `Found ${changedMovies.length} changed movie IDs`);

  // Collect all changed TV IDs
  const changedTv = await paginateAll((page) =>
    getTVChanges(startDate, endDate, page)
  );
  log("INFO", `Found ${changedTv.length} changed TV IDs`);

  // Process movies
  for (const { id: tmdbId } of changedMovies) {
    try {
      const details = await getMovieDetails(tmdbId);
      const isSciFi = (details.genres ?? []).some((g) => g.id === SCIFI_MOVIE_GENRE);

      if (isSciFi) {
        const existing = stmts.getMovieByTmdb.get(tmdbId);
        if (!isDryRun) persistMovie(details);
        if (existing) stats.updated++;
        else stats.added++;
      } else {
        // Not sci-fi — remove if it's in our database
        const existing = stmts.getMovieByTmdb.get(tmdbId);
        if (existing) {
          if (!isDryRun) stmts.deleteMovieByTmdb.run(tmdbId);
          stats.removed++;
          log("INFO", `Removed non-sci-fi movie ${tmdbId} (${details.title})`);
        }
      }
    } catch (err) {
      stats.errors++;
      log("WARN", `Error processing movie ${tmdbId}: ${String(err)}`);
    }
  }

  // Process TV series
  for (const { id: tmdbId } of changedTv) {
    try {
      const details = await getTVDetails(tmdbId);
      const isSciFi = (details.genres ?? []).some((g) => g.id === SCIFI_TV_GENRE);

      if (isSciFi) {
        const existing = stmts.getTvByTmdb.get(tmdbId);
        if (!isDryRun) persistTv(details);
        if (existing) stats.updated++;
        else stats.added++;
      } else {
        const existing = stmts.getTvByTmdb.get(tmdbId);
        if (existing) {
          if (!isDryRun) stmts.deleteTvByTmdb.run(tmdbId);
          stats.removed++;
          log("INFO", `Removed non-sci-fi TV series ${tmdbId} (${details.name})`);
        }
      }
    } catch (err) {
      stats.errors++;
      log("WARN", `Error processing TV series ${tmdbId}: ${String(err)}`);
    }
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  log("INFO", "=== SciFi Only: Incremental Sync Start ===", { dry_run: isDryRun });

  // Read sync state
  const syncState = stmts.getSyncState.get() as {
    last_sync_date: string | null;
    last_change_date: string | null;
    last_sync_type: string | null;
  } | undefined;

  if (!syncState?.last_change_date) {
    log("ERROR", "No last_change_date found in sync_state. Run sync-initial.ts first.");
    process.exit(1);
  }

  const startDate = syncState.last_change_date;
  const endDate = todayUtc();

  if (startDate >= endDate) {
    log("INFO", "Already up to date — no changes to fetch.", { startDate, endDate });
    return;
  }

  const totalDays = daysBetween(startDate, endDate);
  log("INFO", `Syncing changes from ${startDate} to ${endDate} (${totalDays} days)`);

  // Split into chunks if range > 14 days
  let chunks: Array<[string, string]>;
  if (totalDays > MAX_CHANGE_WINDOW_DAYS) {
    chunks = splitDateRange(startDate, endDate, MAX_CHANGE_WINDOW_DAYS);
    log("INFO", `Range exceeds 14 days — splitting into ${chunks.length} chunks`);
  } else {
    chunks = [[startDate, endDate]];
  }

  const stats = { added: 0, updated: 0, removed: 0, errors: 0 };

  for (const [chunkStart, chunkEnd] of chunks) {
    await processChunk(chunkStart, chunkEnd, stats);
  }

  // Update sync state
  const movieCount = (stmts.countMovies.get() as { c: number }).c;
  const tvCount = (stmts.countTv.get() as { c: number }).c;

  if (!isDryRun) {
    stmts.upsertSyncState.run({
      last_sync_date: todayUtc(),
      last_sync_type: "incremental",
      total_movies: movieCount,
      total_tv_series: tvCount,
      last_change_date: endDate,
    });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  log("INFO", "=== Incremental Sync Complete ===", {
    duration_seconds: durationSec,
    added: stats.added,
    updated: stats.updated,
    removed: stats.removed,
    errors: stats.errors,
    total_movies: movieCount,
    total_tv_series: tvCount,
    dry_run: isDryRun,
  });
}

main().catch((err) => {
  console.error("[sync-incremental] Fatal error:", err);
  process.exit(1);
});
