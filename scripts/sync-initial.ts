/**
 * Full initial sync script.
 *
 * Usage:
 *   npx tsx scripts/sync-initial.ts
 *   npx tsx scripts/sync-initial.ts --force   # re-sync even if initial sync already done
 *
 * Strategy:
 *   1. Fetch genre list and save to DB
 *   2. Discover all sci-fi movie IDs via /discover/movie (up to 500 pages)
 *   3. Discover all sci-fi TV IDs via /discover/tv
 *   4. For each ID, fetch full details (credits + keywords)
 *   5. Upsert everything into the database
 *   6. Rebuild FTS denormalized fields
 *   7. Update sync_state
 */

import sqlite from "./db.js";
import {
  discoverSciFiMovies,
  discoverSciFiTV,
  getMovieDetails,
  getTVDetails,
  getGenreList,
  paginateAll,
  sleep,
  type TmdbMovieDetails,
  type TmdbTvDetails,
  type TmdbPerson,
} from "./tmdb-client.js";

// ─────────────────────────────────────────────
// CLI flags
// ─────────────────────────────────────────────

const forceResync = process.argv.includes("--force");

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, meta?: object) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? meta : {}),
  };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ─────────────────────────────────────────────
// Prepared statements
// ─────────────────────────────────────────────

const stmts = {
  upsertGenre: sqlite.prepare(
    `INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)`
  ),

  upsertPerson: sqlite.prepare(`
    INSERT INTO people(tmdb_id, name, profile_path, known_for_department)
    VALUES (@tmdb_id, @name, @profile_path, @known_for_department)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      name = excluded.name,
      profile_path = excluded.profile_path,
      known_for_department = excluded.known_for_department
  `),

  upsertKeyword: sqlite.prepare(
    `INSERT OR REPLACE INTO keywords(id, name) VALUES (?, ?)`
  ),

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
      title             = excluded.title,
      original_title    = excluded.original_title,
      overview          = excluded.overview,
      poster_path       = excluded.poster_path,
      backdrop_path     = excluded.backdrop_path,
      release_date      = excluded.release_date,
      status            = excluded.status,
      runtime           = excluded.runtime,
      vote_average      = excluded.vote_average,
      vote_count        = excluded.vote_count,
      popularity        = excluded.popularity,
      budget            = excluded.budget,
      revenue           = excluded.revenue,
      original_language = excluded.original_language,
      spoken_languages  = excluded.spoken_languages,
      tagline           = excluded.tagline,
      homepage          = excluded.homepage,
      imdb_id           = excluded.imdb_id,
      tmdb_updated_at   = excluded.tmdb_updated_at,
      updated_at        = CURRENT_TIMESTAMP
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
      name               = excluded.name,
      original_name      = excluded.original_name,
      overview           = excluded.overview,
      poster_path        = excluded.poster_path,
      backdrop_path      = excluded.backdrop_path,
      first_air_date     = excluded.first_air_date,
      last_air_date      = excluded.last_air_date,
      status             = excluded.status,
      number_of_seasons  = excluded.number_of_seasons,
      number_of_episodes = excluded.number_of_episodes,
      episode_run_time   = excluded.episode_run_time,
      vote_average       = excluded.vote_average,
      vote_count         = excluded.vote_count,
      popularity         = excluded.popularity,
      original_language  = excluded.original_language,
      spoken_languages   = excluded.spoken_languages,
      tagline            = excluded.tagline,
      homepage           = excluded.homepage,
      networks           = excluded.networks,
      tmdb_updated_at    = excluded.tmdb_updated_at,
      updated_at         = CURRENT_TIMESTAMP
  `),

  getMovieByTmdb: sqlite.prepare(`SELECT id FROM movies WHERE tmdb_id = ?`),
  getTvByTmdb: sqlite.prepare(`SELECT id FROM tv_series WHERE tmdb_id = ?`),
  getPersonByTmdb: sqlite.prepare(`SELECT id FROM people WHERE tmdb_id = ?`),

  deleteMovieGenres: sqlite.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`),
  deleteMovieCast: sqlite.prepare(`DELETE FROM movie_cast WHERE movie_id = ?`),
  deleteMovieCrew: sqlite.prepare(`DELETE FROM movie_crew WHERE movie_id = ?`),
  deleteMovieKeywords: sqlite.prepare(`DELETE FROM movie_keywords WHERE movie_id = ?`),
  deleteMovieCompanies: sqlite.prepare(`DELETE FROM movie_production_companies WHERE movie_id = ?`),

  deleteTvGenres: sqlite.prepare(`DELETE FROM tv_series_genres WHERE tv_series_id = ?`),
  deleteTvCast: sqlite.prepare(`DELETE FROM tv_series_cast WHERE tv_series_id = ?`),
  deleteTvCrew: sqlite.prepare(`DELETE FROM tv_series_crew WHERE tv_series_id = ?`),

  insertMovieGenre: sqlite.prepare(
    `INSERT OR IGNORE INTO movie_genres(movie_id, genre_id) VALUES (?, ?)`
  ),
  insertMovieCast: sqlite.prepare(`
    INSERT OR IGNORE INTO movie_cast(movie_id, person_id, character, display_order)
    VALUES (@movie_id, @person_id, @character, @display_order)
  `),
  insertMovieCrew: sqlite.prepare(`
    INSERT OR IGNORE INTO movie_crew(movie_id, person_id, job, department)
    VALUES (@movie_id, @person_id, @job, @department)
  `),
  insertMovieKeyword: sqlite.prepare(
    `INSERT OR IGNORE INTO movie_keywords(movie_id, keyword_id) VALUES (?, ?)`
  ),
  insertMovieCompany: sqlite.prepare(
    `INSERT OR IGNORE INTO movie_production_companies(movie_id, company_id) VALUES (?, ?)`
  ),

  insertTvGenre: sqlite.prepare(
    `INSERT OR IGNORE INTO tv_series_genres(tv_series_id, genre_id) VALUES (?, ?)`
  ),
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
      cast_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_cast tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
      crew_names    = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_crew tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
      keyword_names = NULL
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

  getSyncState: sqlite.prepare(`SELECT * FROM sync_state WHERE id = 1`),
  countMovies: sqlite.prepare(`SELECT COUNT(*) as c FROM movies`),
  countTv: sqlite.prepare(`SELECT COUNT(*) as c FROM tv_series`),
};

// ─────────────────────────────────────────────
// Helper: upsert a person and return internal id
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

// ─────────────────────────────────────────────
// Helper: persist a full movie record
// ─────────────────────────────────────────────

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

  // Genres
  for (const g of data.genres ?? []) {
    stmts.upsertGenre.run(g.id, g.name);
  }
  stmts.deleteMovieGenres.run(movieId);
  for (const g of data.genres ?? []) {
    stmts.insertMovieGenre.run(movieId, g.id);
  }

  // Production companies
  for (const c of data.production_companies ?? []) {
    stmts.upsertCompany.run({ id: c.id, name: c.name, logo_path: c.logo_path ?? null, origin_country: c.origin_country ?? null });
  }
  stmts.deleteMovieCompanies.run(movieId);
  for (const c of data.production_companies ?? []) {
    stmts.insertMovieCompany.run(movieId, c.id);
  }

  // Keywords
  for (const k of data.keywords?.keywords ?? []) {
    stmts.upsertKeyword.run(k.id, k.name);
  }
  stmts.deleteMovieKeywords.run(movieId);
  for (const k of data.keywords?.keywords ?? []) {
    stmts.insertMovieKeyword.run(movieId, k.id);
  }

  // Cast (top 20)
  stmts.deleteMovieCast.run(movieId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const personId = upsertPerson(person);
    stmts.insertMovieCast.run({
      movie_id: movieId,
      person_id: personId,
      character: person.character ?? null,
      display_order: person.order ?? null,
    });
  }

  // Crew (Directors, Writers, Producers)
  const relevantCrew = (data.credits?.crew ?? []).filter((c) =>
    ["Director", "Writer", "Screenplay", "Producer", "Executive Producer", "Story"].includes(c.job ?? "")
  );
  stmts.deleteMovieCrew.run(movieId);
  for (const person of relevantCrew) {
    const personId = upsertPerson(person);
    stmts.insertMovieCrew.run({
      movie_id: movieId,
      person_id: personId,
      job: person.job ?? null,
      department: person.department ?? null,
    });
  }

  // Denormalized fields
  stmts.updateMovieDenorm.run(movieId);

  return movieId;
});

// ─────────────────────────────────────────────
// Helper: persist a full TV record
// ─────────────────────────────────────────────

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

  // Genres
  for (const g of data.genres ?? []) {
    stmts.upsertGenre.run(g.id, g.name);
  }
  stmts.deleteTvGenres.run(tvId);
  for (const g of data.genres ?? []) {
    stmts.insertTvGenre.run(tvId, g.id);
  }

  // Cast (top 20)
  stmts.deleteTvCast.run(tvId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const personId = upsertPerson(person);
    stmts.insertTvCast.run({
      tv_series_id: tvId,
      person_id: personId,
      character: person.character ?? null,
      display_order: person.order ?? null,
    });
  }

  // Crew
  const relevantCrew = (data.credits?.crew ?? []).filter((c) =>
    ["Director", "Creator", "Showrunner", "Executive Producer", "Writer"].includes(c.job ?? "")
  );
  stmts.deleteTvCrew.run(tvId);
  for (const person of relevantCrew) {
    const personId = upsertPerson(person);
    stmts.insertTvCrew.run({
      tv_series_id: tvId,
      person_id: personId,
      job: person.job ?? null,
      department: person.department ?? null,
    });
  }

  // TV keywords come in data.keywords.results (not .keywords)
  // No dedicated junction table for tv_keywords in schema — skip or add if needed

  stmts.updateTvDenorm.run(tvId);

  return tvId;
});

// ─────────────────────────────────────────────
// Checkpoint helper
// ─────────────────────────────────────────────

function saveCheckpoint(processed: number, total: number, type: string) {
  const today = new Date().toISOString().slice(0, 10);
  const movieCount = (stmts.countMovies.get() as { c: number }).c;
  const tvCount = (stmts.countTv.get() as { c: number }).c;

  stmts.upsertSyncState.run({
    last_sync_date: null,
    last_sync_type: "initial_in_progress",
    total_movies: movieCount,
    total_tv_series: tvCount,
    last_change_date: today,
  });

  log("INFO", `Checkpoint: processed ${processed}/${total} ${type}`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  log("INFO", "=== SciFi Only: Initial Sync Start ===");

  // Check if already synced
  const syncState = stmts.getSyncState.get() as { last_sync_type: string } | undefined;
  if (syncState?.last_sync_type === "initial" && !forceResync) {
    log("INFO", "Initial sync already completed. Use --force to re-sync.");
    return;
  }

  // ── Step 1: Genres ──────────────────────────
  log("INFO", "Fetching genre list...");
  try {
    const genres = await getGenreList();
    for (const g of genres) {
      stmts.upsertGenre.run(g.id, g.name);
    }
    log("INFO", `Saved ${genres.length} genres`);
  } catch (err) {
    log("ERROR", "Failed to fetch genres", { error: String(err) });
    process.exit(1);
  }

  // ── Step 2: Discover sci-fi movie IDs ───────
  log("INFO", "Discovering sci-fi movies via TMDB...");
  let movieIds: number[] = [];
  try {
    const movies = await paginateAll(
      (page) => discoverSciFiMovies(page),
      500,
      (current, total) => {
        if (current % 10 === 0) log("DEBUG", `Movie discovery: page ${current}/${total}`);
      }
    );
    movieIds = [...new Set(movies.map((m) => m.id))];
    log("INFO", `Discovered ${movieIds.length} sci-fi movie IDs`);
  } catch (err) {
    log("ERROR", "Failed to discover movies", { error: String(err) });
    process.exit(1);
  }

  // ── Step 3: Discover sci-fi TV IDs ──────────
  log("INFO", "Discovering sci-fi TV series via TMDB...");
  let tvIds: number[] = [];
  try {
    const tv = await paginateAll(
      (page) => discoverSciFiTV(page),
      500,
      (current, total) => {
        if (current % 10 === 0) log("DEBUG", `TV discovery: page ${current}/${total}`);
      }
    );
    tvIds = [...new Set(tv.map((t) => t.id))];
    log("INFO", `Discovered ${tvIds.length} sci-fi TV series IDs`);
  } catch (err) {
    log("ERROR", "Failed to discover TV series", { error: String(err) });
    process.exit(1);
  }

  // ── Step 4: Fetch and persist movies ────────
  log("INFO", `Fetching details for ${movieIds.length} movies...`);
  let moviesProcessed = 0;
  let moviesErrors = 0;

  for (const tmdbId of movieIds) {
    try {
      const details = await getMovieDetails(tmdbId);
      persistMovie(details);
      moviesProcessed++;

      if (moviesProcessed % 50 === 0) {
        log("INFO", `Processed ${moviesProcessed}/${movieIds.length} movies...`);
        saveCheckpoint(moviesProcessed, movieIds.length, "movies");
      }
    } catch (err) {
      moviesErrors++;
      log("WARN", `Skipping movie ${tmdbId}: ${String(err)}`);
    }
  }

  log("INFO", `Movies done: ${moviesProcessed} succeeded, ${moviesErrors} errors`);

  // ── Step 5: Fetch and persist TV series ─────
  log("INFO", `Fetching details for ${tvIds.length} TV series...`);
  let tvProcessed = 0;
  let tvErrors = 0;

  for (const tmdbId of tvIds) {
    try {
      const details = await getTVDetails(tmdbId);
      persistTv(details);
      tvProcessed++;

      if (tvProcessed % 50 === 0) {
        log("INFO", `Processed ${tvProcessed}/${tvIds.length} TV series...`);
        saveCheckpoint(tvProcessed, tvIds.length, "TV series");
      }
    } catch (err) {
      tvErrors++;
      log("WARN", `Skipping TV series ${tmdbId}: ${String(err)}`);
    }
  }

  log("INFO", `TV series done: ${tvProcessed} succeeded, ${tvErrors} errors`);

  // ── Step 6: Final sync state update ─────────
  const today = new Date().toISOString().slice(0, 10);
  const movieCount = (stmts.countMovies.get() as { c: number }).c;
  const tvCount = (stmts.countTv.get() as { c: number }).c;

  stmts.upsertSyncState.run({
    last_sync_date: today,
    last_sync_type: "initial",
    total_movies: movieCount,
    total_tv_series: tvCount,
    last_change_date: today,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  log("INFO", "=== Initial Sync Complete ===", {
    duration_seconds: durationSec,
    total_movies: movieCount,
    total_tv_series: tvCount,
    movie_errors: moviesErrors,
    tv_errors: tvErrors,
  });
}

main().catch((err) => {
  console.error("[sync-initial] Fatal error:", err);
  process.exit(1);
});
