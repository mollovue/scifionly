/**
 * Fast parallel initial sync script.
 * Resumes from where sync-initial left off, using concurrent requests.
 *
 * Usage:
 *   TMDB_API_KEY=... npx tsx scripts/sync-fast.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "scifionly.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = -64000");

// ── Config ──────────────────────────────────────────
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CONCURRENCY = 8; // parallel requests
const MIN_DELAY_MS = 100; // delay between batches

if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY is required");
  process.exit(1);
}

// ── TMDB Fetch with retries ─────────────────────────
async function tmdbFetch(endpoint: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${TMDB_API_KEY}`, Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        const wait = parseInt(response.headers.get("Retry-After") || "2", 10) * 1000;
        await new Promise(r => setTimeout(r, Math.max(wait, 1000)));
        continue;
      }
      if (response.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status} on ${endpoint}`);
      return response.json();
    } catch (err: any) {
      if (attempt >= 4) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Exhausted retries for ${endpoint}`);
}

// ── Discover all IDs ────────────────────────────────
async function discoverAllIds(mediaType: "movie" | "tv"): Promise<number[]> {
  const genreId = mediaType === "movie" ? "878" : "10765";
  const endpoint = `/discover/${mediaType}`;

  const first = await tmdbFetch(endpoint, {
    with_genres: genreId,
    sort_by: "popularity.desc",
    page: "1",
    include_adult: "false",
  });

  const totalPages = Math.min(first.total_pages, 500);
  console.log(`[discover] ${mediaType}: ${first.total_results} results across ${totalPages} pages`);

  const allResults: number[] = first.results.map((r: any) => r.id);

  // Fetch remaining pages in batches
  for (let startPage = 2; startPage <= totalPages; startPage += CONCURRENCY) {
    const batch = [];
    for (let p = startPage; p < startPage + CONCURRENCY && p <= totalPages; p++) {
      batch.push(
        tmdbFetch(endpoint, {
          with_genres: genreId,
          sort_by: "popularity.desc",
          page: String(p),
          include_adult: "false",
        })
      );
    }
    const results = await Promise.all(batch);
    for (const r of results) {
      if (r?.results) allResults.push(...r.results.map((x: any) => x.id));
    }
    await new Promise(r => setTimeout(r, MIN_DELAY_MS));
  }

  return [...new Set(allResults)];
}

// ── Prepared statements ─────────────────────────────
const stmts = {
  upsertGenre: sqlite.prepare(`INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)`),
  upsertPerson: sqlite.prepare(`
    INSERT INTO people(tmdb_id, name, profile_path, known_for_department)
    VALUES (@tmdb_id, @name, @profile_path, @known_for_department)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      name = excluded.name, profile_path = excluded.profile_path,
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
      title=excluded.title, original_title=excluded.original_title,
      overview=excluded.overview, poster_path=excluded.poster_path,
      backdrop_path=excluded.backdrop_path, release_date=excluded.release_date,
      status=excluded.status, runtime=excluded.runtime,
      vote_average=excluded.vote_average, vote_count=excluded.vote_count,
      popularity=excluded.popularity, budget=excluded.budget,
      revenue=excluded.revenue, original_language=excluded.original_language,
      spoken_languages=excluded.spoken_languages, tagline=excluded.tagline,
      homepage=excluded.homepage, imdb_id=excluded.imdb_id,
      tmdb_updated_at=excluded.tmdb_updated_at, updated_at=CURRENT_TIMESTAMP
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
      name=excluded.name, original_name=excluded.original_name,
      overview=excluded.overview, poster_path=excluded.poster_path,
      backdrop_path=excluded.backdrop_path, first_air_date=excluded.first_air_date,
      last_air_date=excluded.last_air_date, status=excluded.status,
      number_of_seasons=excluded.number_of_seasons, number_of_episodes=excluded.number_of_episodes,
      episode_run_time=excluded.episode_run_time, vote_average=excluded.vote_average,
      vote_count=excluded.vote_count, popularity=excluded.popularity,
      original_language=excluded.original_language, spoken_languages=excluded.spoken_languages,
      tagline=excluded.tagline, homepage=excluded.homepage, networks=excluded.networks,
      tmdb_updated_at=excluded.tmdb_updated_at, updated_at=CURRENT_TIMESTAMP
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
  insertMovieGenre: sqlite.prepare(`INSERT OR IGNORE INTO movie_genres(movie_id, genre_id) VALUES (?, ?)`),
  insertMovieCast: sqlite.prepare(`INSERT OR IGNORE INTO movie_cast(movie_id, person_id, character, display_order) VALUES (@movie_id, @person_id, @character, @display_order)`),
  insertMovieCrew: sqlite.prepare(`INSERT OR IGNORE INTO movie_crew(movie_id, person_id, job, department) VALUES (@movie_id, @person_id, @job, @department)`),
  insertMovieKeyword: sqlite.prepare(`INSERT OR IGNORE INTO movie_keywords(movie_id, keyword_id) VALUES (?, ?)`),
  insertMovieCompany: sqlite.prepare(`INSERT OR IGNORE INTO movie_production_companies(movie_id, company_id) VALUES (?, ?)`),
  insertTvGenre: sqlite.prepare(`INSERT OR IGNORE INTO tv_series_genres(tv_series_id, genre_id) VALUES (?, ?)`),
  insertTvCast: sqlite.prepare(`INSERT OR IGNORE INTO tv_series_cast(tv_series_id, person_id, character, display_order) VALUES (@tv_series_id, @person_id, @character, @display_order)`),
  insertTvCrew: sqlite.prepare(`INSERT OR IGNORE INTO tv_series_crew(tv_series_id, person_id, job, department) VALUES (@tv_series_id, @person_id, @job, @department)`),
  updateMovieDenorm: sqlite.prepare(`
    UPDATE movies SET
      cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_cast mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
      crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_crew mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies.id),
      keyword_names = (SELECT GROUP_CONCAT(k.name, ', ') FROM movie_keywords mk JOIN keywords k ON mk.keyword_id = k.id WHERE mk.movie_id = movies.id)
    WHERE id = ?
  `),
  updateTvDenorm: sqlite.prepare(`
    UPDATE tv_series SET
      cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_cast tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
      crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_crew tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = tv_series.id),
      keyword_names = NULL
    WHERE id = ?
  `),
  upsertSyncState: sqlite.prepare(`
    INSERT INTO sync_state(id, last_sync_date, last_sync_type, total_movies, total_tv_series, last_change_date, updated_at)
    VALUES (1, @last_sync_date, @last_sync_type, @total_movies, @total_tv_series, @last_change_date, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      last_sync_date=excluded.last_sync_date, last_sync_type=excluded.last_sync_type,
      total_movies=excluded.total_movies, total_tv_series=excluded.total_tv_series,
      last_change_date=excluded.last_change_date, updated_at=CURRENT_TIMESTAMP
  `),
  countMovies: sqlite.prepare(`SELECT COUNT(*) as c FROM movies`),
  countTv: sqlite.prepare(`SELECT COUNT(*) as c FROM tv_series`),
  getAllMovieTmdbIds: sqlite.prepare(`SELECT tmdb_id FROM movies`),
  getAllTvTmdbIds: sqlite.prepare(`SELECT tmdb_id FROM tv_series`),
};

function upsertPerson(p: any): number {
  stmts.upsertPerson.run({
    tmdb_id: p.id,
    name: p.name,
    profile_path: p.profile_path ?? null,
    known_for_department: p.known_for_department ?? null,
  });
  return (stmts.getPersonByTmdb.get(p.id) as { id: number }).id;
}

const persistMovie = sqlite.transaction((data: any) => {
  stmts.upsertMovie.run({
    tmdb_id: data.id, title: data.title, original_title: data.original_title ?? null,
    overview: data.overview ?? null, poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null, release_date: data.release_date ?? null,
    status: data.status ?? null, runtime: data.runtime ?? null,
    vote_average: data.vote_average ?? null, vote_count: data.vote_count ?? null,
    popularity: data.popularity ?? null, budget: data.budget ?? null,
    revenue: data.revenue ?? null, original_language: data.original_language ?? null,
    spoken_languages: data.spoken_languages ? JSON.stringify(data.spoken_languages.map((l: any) => l.iso_639_1)) : null,
    tagline: data.tagline ?? null, homepage: data.homepage ?? null,
    imdb_id: data.imdb_id ?? null, tmdb_updated_at: new Date().toISOString(),
  });
  const movieId = (stmts.getMovieByTmdb.get(data.id) as { id: number }).id;

  for (const g of data.genres ?? []) stmts.upsertGenre.run(g.id, g.name);
  stmts.deleteMovieGenres.run(movieId);
  for (const g of data.genres ?? []) stmts.insertMovieGenre.run(movieId, g.id);

  for (const c of data.production_companies ?? [])
    stmts.upsertCompany.run({ id: c.id, name: c.name, logo_path: c.logo_path ?? null, origin_country: c.origin_country ?? null });
  stmts.deleteMovieCompanies.run(movieId);
  for (const c of data.production_companies ?? []) stmts.insertMovieCompany.run(movieId, c.id);

  for (const k of data.keywords?.keywords ?? []) stmts.upsertKeyword.run(k.id, k.name);
  stmts.deleteMovieKeywords.run(movieId);
  for (const k of data.keywords?.keywords ?? []) stmts.insertMovieKeyword.run(movieId, k.id);

  stmts.deleteMovieCast.run(movieId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const pid = upsertPerson(person);
    stmts.insertMovieCast.run({ movie_id: movieId, person_id: pid, character: person.character ?? null, display_order: person.order ?? null });
  }

  const relevantCrew = (data.credits?.crew ?? []).filter((c: any) =>
    ["Director", "Writer", "Screenplay", "Producer", "Executive Producer", "Story"].includes(c.job ?? "")
  );
  stmts.deleteMovieCrew.run(movieId);
  for (const person of relevantCrew) {
    const pid = upsertPerson(person);
    stmts.insertMovieCrew.run({ movie_id: movieId, person_id: pid, job: person.job ?? null, department: person.department ?? null });
  }

  stmts.updateMovieDenorm.run(movieId);
});

const persistTv = sqlite.transaction((data: any) => {
  stmts.upsertTv.run({
    tmdb_id: data.id, name: data.name, original_name: data.original_name ?? null,
    overview: data.overview ?? null, poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null, first_air_date: data.first_air_date ?? null,
    last_air_date: data.last_air_date ?? null, status: data.status ?? null,
    number_of_seasons: data.number_of_seasons ?? null, number_of_episodes: data.number_of_episodes ?? null,
    episode_run_time: data.episode_run_time ? JSON.stringify(data.episode_run_time) : null,
    vote_average: data.vote_average ?? null, vote_count: data.vote_count ?? null,
    popularity: data.popularity ?? null, original_language: data.original_language ?? null,
    spoken_languages: data.spoken_languages ? JSON.stringify(data.spoken_languages.map((l: any) => l.iso_639_1)) : null,
    tagline: data.tagline ?? null, homepage: data.homepage ?? null,
    networks: data.networks ? JSON.stringify(data.networks.map((n: any) => n.name)) : null,
    tmdb_updated_at: new Date().toISOString(),
  });
  const tvId = (stmts.getTvByTmdb.get(data.id) as { id: number }).id;

  for (const g of data.genres ?? []) stmts.upsertGenre.run(g.id, g.name);
  stmts.deleteTvGenres.run(tvId);
  for (const g of data.genres ?? []) stmts.insertTvGenre.run(tvId, g.id);

  stmts.deleteTvCast.run(tvId);
  for (const person of (data.credits?.cast ?? []).slice(0, 20)) {
    const pid = upsertPerson(person);
    stmts.insertTvCast.run({ tv_series_id: tvId, person_id: pid, character: person.character ?? null, display_order: person.order ?? null });
  }

  const relevantCrew = (data.credits?.crew ?? []).filter((c: any) =>
    ["Director", "Creator", "Showrunner", "Executive Producer", "Writer"].includes(c.job ?? "")
  );
  stmts.deleteTvCrew.run(tvId);
  for (const person of relevantCrew) {
    const pid = upsertPerson(person);
    stmts.insertTvCrew.run({ tv_series_id: tvId, person_id: pid, job: person.job ?? null, department: person.department ?? null });
  }

  stmts.updateTvDenorm.run(tvId);
});

// ── Process IDs in parallel batches ─────────────────
async function processInBatches(
  ids: number[],
  mediaType: "movie" | "tv",
  persist: (data: any) => void,
  label: string
) {
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(id =>
        tmdbFetch(`/${mediaType}/${id}`, { append_to_response: "credits,keywords" })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        try {
          persist(result.value);
          processed++;
        } catch (e) {
          errors++;
        }
      } else {
        errors++;
      }
    }

    if ((i + CONCURRENCY) % 200 === 0 || i + CONCURRENCY >= ids.length) {
      console.log(`[${label}] ${processed}/${ids.length} done (${errors} errors)`);
    }

    await new Promise(r => setTimeout(r, MIN_DELAY_MS));
  }

  return { processed, errors };
}

// ── Main ────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log("=== SciFi Only: Fast Parallel Sync ===");

  // Get existing IDs to skip
  const existingMovieIds = new Set(
    (stmts.getAllMovieTmdbIds.all() as { tmdb_id: number }[]).map(r => r.tmdb_id)
  );
  const existingTvIds = new Set(
    (stmts.getAllTvTmdbIds.all() as { tmdb_id: number }[]).map(r => r.tmdb_id)
  );
  console.log(`Already have: ${existingMovieIds.size} movies, ${existingTvIds.size} TV series`);

  // Discover sci-fi movies
  console.log("Discovering sci-fi movies...");
  const allMovieIds = await discoverAllIds("movie");
  const newMovieIds = allMovieIds.filter(id => !existingMovieIds.has(id));
  console.log(`Found ${allMovieIds.length} total, ${newMovieIds.length} new movies to fetch`);

  // Discover sci-fi TV
  console.log("Discovering sci-fi TV series...");
  const allTvIds = await discoverAllIds("tv");
  const newTvIds = allTvIds.filter(id => !existingTvIds.has(id));
  console.log(`Found ${allTvIds.length} total, ${newTvIds.length} new TV series to fetch`);

  // Fetch genres
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch("/genre/movie/list"),
    tmdbFetch("/genre/tv/list"),
  ]);
  for (const g of [...movieGenres.genres, ...tvGenres.genres]) {
    stmts.upsertGenre.run(g.id, g.name);
  }
  console.log("Genres loaded");

  // Process movies
  if (newMovieIds.length > 0) {
    console.log(`Fetching ${newMovieIds.length} movies...`);
    const movieResult = await processInBatches(newMovieIds, "movie", persistMovie, "movies");
    console.log(`Movies complete: ${movieResult.processed} ok, ${movieResult.errors} errors`);
  }

  // Process TV
  if (newTvIds.length > 0) {
    console.log(`Fetching ${newTvIds.length} TV series...`);
    const tvResult = await processInBatches(newTvIds, "tv", persistTv, "TV");
    console.log(`TV complete: ${tvResult.processed} ok, ${tvResult.errors} errors`);
  }

  // Final state
  const movieCount = (stmts.countMovies.get() as { c: number }).c;
  const tvCount = (stmts.countTv.get() as { c: number }).c;
  const today = new Date().toISOString().slice(0, 10);

  stmts.upsertSyncState.run({
    last_sync_date: today,
    last_sync_type: "initial",
    total_movies: movieCount,
    total_tv_series: tvCount,
    last_change_date: today,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`=== Done in ${durationSec}s: ${movieCount} movies, ${tvCount} TV series ===`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
