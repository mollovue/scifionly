import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync, existsSync, unlinkSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Ensure the data directory exists
mkdirSync(join(process.cwd(), "data"), { recursive: true });

const dbPath = join(process.cwd(), "data/scifionly.db");
const seedPath = join(process.cwd(), "data/seed/scifionly-seed.db.gz");

// ─────────────────────────────────────────────
// Auto-load seed data if database is empty
// ─────────────────────────────────────────────

function loadSeedDataIfNeeded(): void {
  let needsSeed = false;

  if (!existsSync(dbPath)) {
    needsSeed = true;
  } else {
    try {
      const testDb = new Database(dbPath);
      // Check if movies table exists and has data
      const tableExists = testDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'")
        .get();
      if (!tableExists) {
        needsSeed = true;
      } else {
        const result = testDb.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number };
        if (result.c === 0) needsSeed = true;
      }
      testDb.close();
    } catch {
      needsSeed = true;
    }
  }

  if (needsSeed && existsSync(seedPath)) {
    console.log("[storage] Database is empty — loading seed data...");
    // Remove existing DB files
    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
      const f = dbPath + suffix;
      if (existsSync(f)) unlinkSync(f);
    }
    try {
      // Decompress seed data using gunzip
      execSync(`gunzip -c "${seedPath}" > "${dbPath}"`, { stdio: "pipe" });
      const dbSize = (statSync(dbPath).size / (1024 * 1024)).toFixed(1);
      console.log(`[storage] Seed data loaded: ${dbSize} MB`);
    } catch (err) {
      console.error("[storage] Failed to load seed data:", err);
    }
  } else if (needsSeed) {
    console.log("[storage] Database is empty and no seed data found at", seedPath);
  }
}

loadSeedDataIfNeeded();

const sqlite = new Database(dbPath);

// Performance pragmas
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = -64000");
sqlite.pragma("mmap_size = 268435456");

export const db = drizzle(sqlite);

// ─────────────────────────────────────────────
// Types for storage layer
// ─────────────────────────────────────────────

export interface SearchParams {
  query?: string;
  type?: "movie" | "tv" | "both";
  cast_id?: number;
  crew_id?: number;
  year_min?: number;
  year_max?: number;
  status?: string;
  language?: string;
  rating_min?: number;
  rating_max?: number;
  min_votes?: number;
  keyword_id?: number;
  sort_by?: "popularity" | "vote_average" | "release_date" | "title";
  sort_order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface SearchResult {
  id: number;
  tmdb_id: number;
  type: "movie" | "tv";
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  status: string | null;
  vote_average: number | null;
  vote_count: integer | null;
  popularity: number | null;
  original_language: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MovieDetail {
  id: number;
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  status: string | null;
  runtime: number | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  budget: number | null;
  revenue: number | null;
  original_language: string | null;
  spoken_languages: string | null;
  tagline: string | null;
  homepage: string | null;
  imdb_id: string | null;
  genres: Array<{ id: number; name: string }>;
  cast: Array<{ person_id: number; name: string; profile_path: string | null; character: string | null; display_order: number | null }>;
  crew: Array<{ person_id: number; name: string; profile_path: string | null; job: string | null; department: string | null }>;
  keywords: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null; origin_country: string | null }>;
}

export interface TvSeriesDetail {
  id: number;
  tmdb_id: number;
  name: string;
  original_name: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  status: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  episode_run_time: string | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  original_language: string | null;
  spoken_languages: string | null;
  tagline: string | null;
  homepage: string | null;
  networks: string | null;
  genres: Array<{ id: number; name: string }>;
  cast: Array<{ person_id: number; name: string; profile_path: string | null; character: string | null; display_order: number | null }>;
  crew: Array<{ person_id: number; name: string; profile_path: string | null; job: string | null; department: string | null }>;
}

export interface PersonDetail {
  id: number;
  tmdb_id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string | null;
  movie_credits: Array<{
    movie_id: number;
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    release_date: string | null;
    character: string | null;
    job: string | null;
    role: "cast" | "crew";
  }>;
  tv_credits: Array<{
    tv_series_id: number;
    tmdb_id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string | null;
    character: string | null;
    job: string | null;
    role: "cast" | "crew";
  }>;
}

export interface Stats {
  total_movies: number;
  total_tv_series: number;
  last_sync: string | null;
  genres_count: number;
  people_count: number;
}

// Workaround for the TypeScript interface type
type integer = number;

// ─────────────────────────────────────────────
// IStorage interface
// ─────────────────────────────────────────────

export interface IStorage {
  searchContent(params: SearchParams): SearchResponse;
  getMovieById(id: number): MovieDetail | undefined;
  getTvSeriesById(id: number): TvSeriesDetail | undefined;
  getPersonById(id: number): PersonDetail | undefined;
  getTrending(type: "movie" | "tv", limit: number): SearchResult[];
  getTopRated(type: "movie" | "tv", limit: number): SearchResult[];
  getRecent(type: "movie" | "tv", limit: number): SearchResult[];
  getUpcoming(type: "movie" | "tv", limit: number): SearchResult[];
  autocompletePeople(query: string, limit: number): Array<{ id: number; name: string; profile_path: string | null; known_for_department: string | null }>;
  autocompleteKeywords(query: string, limit: number): Array<{ id: number; name: string }>;
  getStats(): Stats;
  getCachedImage(mediaType: "movie" | "tv", mediaId: number, imageType: "poster" | "backdrop", size: string): { image_data: Buffer; content_type: string } | null;
  cacheImage(mediaType: string, mediaId: number, imageType: string, size: string, tmdbPath: string | null, imageData: Buffer, contentType: string, fileSize: number): void;
  getTmdbImagePath(mediaType: "movie" | "tv", mediaId: number, imageType: "poster" | "backdrop"): string | null;
}

// ─────────────────────────────────────────────
// DatabaseStorage implementation
// ─────────────────────────────────────────────

export class DatabaseStorage implements IStorage {
  constructor() {
    this.createTables();
  }

  private createTables(): void {
    sqlite.exec(`
      -- Core reference tables
      CREATE TABLE IF NOT EXISTS genres (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS people (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id               INTEGER NOT NULL UNIQUE,
        name                  TEXT NOT NULL,
        profile_path          TEXT,
        known_for_department  TEXT
      );

      CREATE TABLE IF NOT EXISTS keywords (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS production_companies (
        id             INTEGER PRIMARY KEY,
        name           TEXT NOT NULL,
        logo_path      TEXT,
        origin_country TEXT
      );

      -- Movies
      CREATE TABLE IF NOT EXISTS movies (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id           INTEGER NOT NULL UNIQUE,
        title             TEXT NOT NULL,
        original_title    TEXT,
        overview          TEXT,
        poster_path       TEXT,
        backdrop_path     TEXT,
        release_date      TEXT,
        status            TEXT,
        runtime           INTEGER,
        vote_average      REAL,
        vote_count        INTEGER,
        popularity        REAL,
        budget            INTEGER,
        revenue           INTEGER,
        original_language TEXT,
        spoken_languages  TEXT,
        tagline           TEXT,
        homepage          TEXT,
        imdb_id           TEXT,
        cast_names        TEXT,
        crew_names        TEXT,
        keyword_names     TEXT,
        tmdb_updated_at   TEXT,
        created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at        TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- TV Series
      CREATE TABLE IF NOT EXISTS tv_series (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id             INTEGER NOT NULL UNIQUE,
        name                TEXT NOT NULL,
        original_name       TEXT,
        overview            TEXT,
        poster_path         TEXT,
        backdrop_path       TEXT,
        first_air_date      TEXT,
        last_air_date       TEXT,
        status              TEXT,
        number_of_seasons   INTEGER,
        number_of_episodes  INTEGER,
        episode_run_time    TEXT,
        vote_average        REAL,
        vote_count          INTEGER,
        popularity          REAL,
        original_language   TEXT,
        spoken_languages    TEXT,
        tagline             TEXT,
        homepage            TEXT,
        networks            TEXT,
        cast_names          TEXT,
        crew_names          TEXT,
        keyword_names       TEXT,
        tmdb_updated_at     TEXT,
        created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Junction tables — movies
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id  INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id  INTEGER NOT NULL REFERENCES genres(id),
        PRIMARY KEY (movie_id, genre_id)
      );

      CREATE TABLE IF NOT EXISTS movie_cast (
        movie_id      INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        person_id     INTEGER NOT NULL REFERENCES people(id),
        character     TEXT,
        display_order INTEGER,
        PRIMARY KEY (movie_id, person_id, character)
      );

      CREATE TABLE IF NOT EXISTS movie_crew (
        movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        person_id  INTEGER NOT NULL REFERENCES people(id),
        job        TEXT,
        department TEXT,
        PRIMARY KEY (movie_id, person_id, job)
      );

      CREATE TABLE IF NOT EXISTS movie_keywords (
        movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        keyword_id INTEGER NOT NULL REFERENCES keywords(id),
        PRIMARY KEY (movie_id, keyword_id)
      );

      CREATE TABLE IF NOT EXISTS movie_production_companies (
        movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES production_companies(id),
        PRIMARY KEY (movie_id, company_id)
      );

      -- Junction tables — TV series
      CREATE TABLE IF NOT EXISTS tv_series_genres (
        tv_series_id INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        genre_id     INTEGER NOT NULL REFERENCES genres(id),
        PRIMARY KEY (tv_series_id, genre_id)
      );

      CREATE TABLE IF NOT EXISTS tv_series_cast (
        tv_series_id  INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        person_id     INTEGER NOT NULL REFERENCES people(id),
        character     TEXT,
        display_order INTEGER,
        PRIMARY KEY (tv_series_id, person_id, character)
      );

      CREATE TABLE IF NOT EXISTS tv_series_crew (
        tv_series_id INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        person_id    INTEGER NOT NULL REFERENCES people(id),
        job          TEXT,
        department   TEXT,
        PRIMARY KEY (tv_series_id, person_id, job)
      );

      -- Sync state (singleton)
      CREATE TABLE IF NOT EXISTS sync_state (
        id               INTEGER PRIMARY KEY DEFAULT 1,
        last_sync_date   TEXT,
        last_sync_type   TEXT,
        total_movies     INTEGER DEFAULT 0,
        total_tv_series  INTEGER DEFAULT 0,
        last_change_date TEXT,
        updated_at       TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- ─── Indexes ─────────────────────────────────
      CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id          ON movies(tmdb_id);
      CREATE INDEX IF NOT EXISTS idx_movies_release_date     ON movies(release_date);
      CREATE INDEX IF NOT EXISTS idx_movies_popularity       ON movies(popularity DESC);
      CREATE INDEX IF NOT EXISTS idx_movies_vote_average     ON movies(vote_average DESC);
      CREATE INDEX IF NOT EXISTS idx_movies_status           ON movies(status);
      CREATE INDEX IF NOT EXISTS idx_movies_original_language ON movies(original_language);

      CREATE INDEX IF NOT EXISTS idx_tv_series_tmdb_id           ON tv_series(tmdb_id);
      CREATE INDEX IF NOT EXISTS idx_tv_series_first_air_date    ON tv_series(first_air_date);
      CREATE INDEX IF NOT EXISTS idx_tv_series_popularity        ON tv_series(popularity DESC);
      CREATE INDEX IF NOT EXISTS idx_tv_series_vote_average      ON tv_series(vote_average DESC);
      CREATE INDEX IF NOT EXISTS idx_tv_series_status            ON tv_series(status);
      CREATE INDEX IF NOT EXISTS idx_tv_series_original_language ON tv_series(original_language);

      CREATE INDEX IF NOT EXISTS idx_people_tmdb_id ON people(tmdb_id);
      CREATE INDEX IF NOT EXISTS idx_people_name    ON people(name);

      CREATE INDEX IF NOT EXISTS idx_movie_cast_person ON movie_cast(person_id);
      CREATE INDEX IF NOT EXISTS idx_movie_crew_person ON movie_crew(person_id);
      CREATE INDEX IF NOT EXISTS idx_movie_crew_job    ON movie_crew(job);
      CREATE INDEX IF NOT EXISTS idx_tv_cast_person    ON tv_series_cast(person_id);
      CREATE INDEX IF NOT EXISTS idx_tv_crew_person    ON tv_series_crew(person_id);

      -- ─── Image cache ──────────────────────────────
      CREATE TABLE IF NOT EXISTS image_cache (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        media_type  TEXT    NOT NULL,
        media_id    INTEGER NOT NULL,
        image_type  TEXT    NOT NULL,
        size        TEXT    NOT NULL,
        tmdb_path   TEXT,
        image_data  BLOB    NOT NULL,
        content_type TEXT   NOT NULL,
        file_size   INTEGER NOT NULL DEFAULT 0,
        fetched_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(media_type, media_id, image_type, size)
      );

      CREATE INDEX IF NOT EXISTS idx_image_cache_lookup ON image_cache(media_type, media_id, image_type, size);

      -- ─── FTS5 virtual tables ──────────────────────
      CREATE VIRTUAL TABLE IF NOT EXISTS movies_fts USING fts5(
        title,
        original_title,
        overview,
        tagline,
        cast_names,
        crew_names,
        keyword_names,
        content=movies,
        content_rowid=id,
        tokenize='porter unicode61'
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS tv_series_fts USING fts5(
        name,
        original_name,
        overview,
        tagline,
        cast_names,
        crew_names,
        keyword_names,
        content=tv_series,
        content_rowid=id,
        tokenize='porter unicode61'
      );

      -- ─── FTS sync triggers — movies ──────────────
      CREATE TRIGGER IF NOT EXISTS movies_ai AFTER INSERT ON movies BEGIN
        INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES (new.id, new.title, new.original_title, new.overview, new.tagline,
                COALESCE(new.cast_names, ''), COALESCE(new.crew_names, ''), COALESCE(new.keyword_names, ''));
      END;

      CREATE TRIGGER IF NOT EXISTS movies_ad AFTER DELETE ON movies BEGIN
        INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline,
                COALESCE(old.cast_names, ''), COALESCE(old.crew_names, ''), COALESCE(old.keyword_names, ''));
      END;

      CREATE TRIGGER IF NOT EXISTS movies_au AFTER UPDATE ON movies BEGIN
        INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline,
                COALESCE(old.cast_names, ''), COALESCE(old.crew_names, ''), COALESCE(old.keyword_names, ''));
        INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES (new.id, new.title, new.original_title, new.overview, new.tagline,
                COALESCE(new.cast_names, ''), COALESCE(new.crew_names, ''), COALESCE(new.keyword_names, ''));
      END;

      -- ─── FTS sync triggers — tv_series ───────────
      CREATE TRIGGER IF NOT EXISTS tv_series_ai AFTER INSERT ON tv_series BEGIN
        INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES (new.id, new.name, new.original_name, new.overview, new.tagline,
                COALESCE(new.cast_names, ''), COALESCE(new.crew_names, ''), COALESCE(new.keyword_names, ''));
      END;

      CREATE TRIGGER IF NOT EXISTS tv_series_ad AFTER DELETE ON tv_series BEGIN
        INSERT INTO tv_series_fts(tv_series_fts, rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES ('delete', old.id, old.name, old.original_name, old.overview, old.tagline,
                COALESCE(old.cast_names, ''), COALESCE(old.crew_names, ''), COALESCE(old.keyword_names, ''));
      END;

      CREATE TRIGGER IF NOT EXISTS tv_series_au AFTER UPDATE ON tv_series BEGIN
        INSERT INTO tv_series_fts(tv_series_fts, rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES ('delete', old.id, old.name, old.original_name, old.overview, old.tagline,
                COALESCE(old.cast_names, ''), COALESCE(old.crew_names, ''), COALESCE(old.keyword_names, ''));
        INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
        VALUES (new.id, new.name, new.original_name, new.overview, new.tagline,
                COALESCE(new.cast_names, ''), COALESCE(new.crew_names, ''), COALESCE(new.keyword_names, ''));
      END;
    `);
  }

  // ─── Helper: build movie WHERE clause ────────────────────────────────────

  private buildMovieWhere(params: SearchParams): { clause: string; bindings: unknown[] } {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (params.query) {
      // Use FTS5 via a subquery — fall back to LIKE if FTS fails
      conditions.push(`m.id IN (SELECT rowid FROM movies_fts WHERE movies_fts MATCH ?)`);
      bindings.push(params.query.trim().split(/\s+/).map(w => `"${w.replace(/"/g, '""')}"`).join(' OR '));
    }

    if (params.cast_id !== undefined) {
      conditions.push(`m.id IN (SELECT movie_id FROM movie_cast WHERE person_id = ?)`);
      bindings.push(params.cast_id);
    }

    if (params.crew_id !== undefined) {
      conditions.push(`m.id IN (SELECT movie_id FROM movie_crew WHERE person_id = ?)`);
      bindings.push(params.crew_id);
    }

    if (params.year_min !== undefined) {
      conditions.push(`CAST(substr(m.release_date, 1, 4) AS INTEGER) >= ?`);
      bindings.push(params.year_min);
    }

    if (params.year_max !== undefined) {
      conditions.push(`CAST(substr(m.release_date, 1, 4) AS INTEGER) <= ?`);
      bindings.push(params.year_max);
    }

    if (params.status) {
      conditions.push(`m.status = ?`);
      bindings.push(params.status);
    }

    if (params.language) {
      conditions.push(`m.original_language = ?`);
      bindings.push(params.language);
    }

    if (params.rating_min !== undefined) {
      conditions.push(`m.vote_average >= ?`);
      bindings.push(params.rating_min);
    }

    if (params.rating_max !== undefined) {
      conditions.push(`m.vote_average <= ?`);
      bindings.push(params.rating_max);
    }

    if (params.min_votes !== undefined) {
      conditions.push(`m.vote_count >= ?`);
      bindings.push(params.min_votes);
    }

    if (params.keyword_id !== undefined) {
      conditions.push(`m.id IN (SELECT movie_id FROM movie_keywords WHERE keyword_id = ?)`);
      bindings.push(params.keyword_id);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return { clause, bindings };
  }

  // ─── Helper: build TV WHERE clause ───────────────────────────────────────

  private buildTvWhere(params: SearchParams): { clause: string; bindings: unknown[] } {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (params.query) {
      conditions.push(`t.id IN (SELECT rowid FROM tv_series_fts WHERE tv_series_fts MATCH ?)`);
      bindings.push(params.query.trim().split(/\s+/).map(w => `"${w.replace(/"/g, '""')}"`).join(' OR '));
    }

    if (params.cast_id !== undefined) {
      conditions.push(`t.id IN (SELECT tv_series_id FROM tv_series_cast WHERE person_id = ?)`);
      bindings.push(params.cast_id);
    }

    if (params.crew_id !== undefined) {
      conditions.push(`t.id IN (SELECT tv_series_id FROM tv_series_crew WHERE person_id = ?)`);
      bindings.push(params.crew_id);
    }

    if (params.year_min !== undefined) {
      conditions.push(`CAST(substr(t.first_air_date, 1, 4) AS INTEGER) >= ?`);
      bindings.push(params.year_min);
    }

    if (params.year_max !== undefined) {
      conditions.push(`CAST(substr(t.first_air_date, 1, 4) AS INTEGER) <= ?`);
      bindings.push(params.year_max);
    }

    if (params.status) {
      conditions.push(`t.status = ?`);
      bindings.push(params.status);
    }

    if (params.language) {
      conditions.push(`t.original_language = ?`);
      bindings.push(params.language);
    }

    if (params.rating_min !== undefined) {
      conditions.push(`t.vote_average >= ?`);
      bindings.push(params.rating_min);
    }

    if (params.rating_max !== undefined) {
      conditions.push(`t.vote_average <= ?`);
      bindings.push(params.rating_max);
    }

    if (params.min_votes !== undefined) {
      conditions.push(`t.vote_count >= ?`);
      bindings.push(params.min_votes);
    }

    if (params.keyword_id !== undefined) {
      // TV series keywords would need a similar junction table; skip if not present
      conditions.push(`1 = 0`); // no keyword junction for TV in this schema version
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return { clause, bindings };
  }

  // ─── Helper: sort clause ─────────────────────────────────────────────────

  private buildOrderClause(
    params: SearchParams,
    titleCol: string,
    dateCol: string
  ): string {
    const col = params.sort_by ?? "popularity";
    const dir = (params.sort_order ?? "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
    switch (col) {
      case "vote_average":  return `ORDER BY vote_average ${dir}, vote_count DESC`;
      case "release_date":  return `ORDER BY ${dateCol} ${dir}`;
      case "title":         return `ORDER BY ${titleCol} ${dir}`;
      default:              return `ORDER BY popularity ${dir}`;
    }
  }

  // ─── Helper: map raw movie row to SearchResult ────────────────────────────

  private mapMovieRow(row: Record<string, unknown>): SearchResult {
    return {
      id: row.id as number,
      tmdb_id: row.tmdb_id as number,
      type: "movie",
      title: row.title as string,
      original_title: row.original_title as string | null,
      overview: row.overview as string | null,
      poster_path: row.poster_path as string | null,
      backdrop_path: row.backdrop_path as string | null,
      release_date: row.release_date as string | null,
      status: row.status as string | null,
      vote_average: row.vote_average as number | null,
      vote_count: row.vote_count as number | null,
      popularity: row.popularity as number | null,
      original_language: row.original_language as string | null,
    };
  }

  private mapTvRow(row: Record<string, unknown>): SearchResult {
    return {
      id: row.id as number,
      tmdb_id: row.tmdb_id as number,
      type: "tv",
      title: row.name as string,
      original_title: row.original_name as string | null,
      overview: row.overview as string | null,
      poster_path: row.poster_path as string | null,
      backdrop_path: row.backdrop_path as string | null,
      release_date: row.first_air_date as string | null,
      status: row.status as string | null,
      vote_average: row.vote_average as number | null,
      vote_count: row.vote_count as number | null,
      popularity: row.popularity as number | null,
      original_language: row.original_language as string | null,
    };
  }

  // ─── searchContent ────────────────────────────────────────────────────────

  searchContent(params: SearchParams): SearchResponse {
    const page = Math.max(1, params.page ?? 1);
    const per_page = Math.min(100, Math.max(1, params.per_page ?? 20));
    const offset = (page - 1) * per_page;

    const type = params.type ?? "both";

    const movieFields = `
      m.id, m.tmdb_id, 'movie' AS type, m.title, m.original_title,
      m.overview, m.poster_path, m.backdrop_path, m.release_date,
      m.status, m.vote_average, m.vote_count, m.popularity, m.original_language,
      m.title AS sort_title, m.release_date AS sort_date
    `;

    const tvFields = `
      t.id, t.tmdb_id, 'tv' AS type, t.name AS title, t.original_name AS original_title,
      t.overview, t.poster_path, t.backdrop_path, t.first_air_date AS release_date,
      t.status, t.vote_average, t.vote_count, t.popularity, t.original_language,
      t.name AS sort_title, t.first_air_date AS sort_date
    `;

    const sortBy = params.sort_by ?? "popularity";
    const sortDir = (params.sort_order ?? "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const sortSuffix = sortBy === "title"
      ? `sort_title ${sortDir}`
      : sortBy === "release_date"
      ? `sort_date ${sortDir}`
      : sortBy === "vote_average"
      ? `vote_average ${sortDir}, vote_count DESC`
      : `popularity ${sortDir}`;

    let countSql: string;
    let dataSql: string;
    let countBindings: unknown[];
    let dataBindings: unknown[];

    if (type === "movie") {
      const { clause, bindings } = this.buildMovieWhere(params);
      countSql = `SELECT COUNT(*) AS total FROM movies m ${clause}`;
      dataSql = `SELECT ${movieFields} FROM movies m ${clause} ORDER BY ${sortSuffix} LIMIT ? OFFSET ?`;
      countBindings = bindings;
      dataBindings = [...bindings, per_page, offset];
    } else if (type === "tv") {
      const { clause, bindings } = this.buildTvWhere(params);
      countSql = `SELECT COUNT(*) AS total FROM tv_series t ${clause}`;
      dataSql = `SELECT ${tvFields} FROM tv_series t ${clause} ORDER BY ${sortSuffix} LIMIT ? OFFSET ?`;
      countBindings = bindings;
      dataBindings = [...bindings, per_page, offset];
    } else {
      // "both" — UNION ALL
      const movieWhere = this.buildMovieWhere(params);
      const tvWhere = this.buildTvWhere(params);

      const movieSubq = `SELECT ${movieFields} FROM movies m ${movieWhere.clause}`;
      const tvSubq = `SELECT ${tvFields} FROM tv_series t ${tvWhere.clause}`;

      countSql = `SELECT COUNT(*) AS total FROM (${movieSubq} UNION ALL ${tvSubq}) AS combined`;
      dataSql = `SELECT * FROM (${movieSubq} UNION ALL ${tvSubq}) AS combined ORDER BY ${sortSuffix} LIMIT ? OFFSET ?`;
      countBindings = [...movieWhere.bindings, ...tvWhere.bindings];
      dataBindings = [...movieWhere.bindings, ...tvWhere.bindings, per_page, offset];
    }

    let total = 0;
    try {
      const countRow = sqlite.prepare(countSql).get(...countBindings) as { total: number };
      total = countRow?.total ?? 0;
    } catch {
      // FTS may fail for certain query strings; return empty
      return { results: [], total: 0, page, per_page, total_pages: 0 };
    }

    let rows: SearchResult[] = [];
    try {
      const rawRows = sqlite.prepare(dataSql).all(...dataBindings) as Record<string, unknown>[];
      rows = rawRows.map(row => ({
        id: row.id as number,
        tmdb_id: row.tmdb_id as number,
        type: row.type as "movie" | "tv",
        title: row.title as string,
        original_title: row.original_title as string | null,
        overview: row.overview as string | null,
        poster_path: row.poster_path as string | null,
        backdrop_path: row.backdrop_path as string | null,
        release_date: row.release_date as string | null,
        status: row.status as string | null,
        vote_average: row.vote_average as number | null,
        vote_count: row.vote_count as number | null,
        popularity: row.popularity as number | null,
        original_language: row.original_language as string | null,
      }));
    } catch {
      return { results: [], total: 0, page, per_page, total_pages: 0 };
    }

    return {
      results: rows,
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page),
    };
  }

  // ─── getMovieById ─────────────────────────────────────────────────────────

  getMovieById(id: number): MovieDetail | undefined {
    const movie = sqlite.prepare(`
      SELECT * FROM movies WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!movie) return undefined;

    const genres = sqlite.prepare(`
      SELECT g.id, g.name FROM genres g
      JOIN movie_genres mg ON mg.genre_id = g.id
      WHERE mg.movie_id = ?
    `).all(id) as Array<{ id: number; name: string }>;

    const cast = sqlite.prepare(`
      SELECT mc.person_id, p.name, p.profile_path, mc.character, mc.display_order
      FROM movie_cast mc
      JOIN people p ON p.id = mc.person_id
      WHERE mc.movie_id = ?
      ORDER BY mc.display_order ASC
    `).all(id) as Array<{ person_id: number; name: string; profile_path: string | null; character: string | null; display_order: number | null }>;

    const crew = sqlite.prepare(`
      SELECT mcr.person_id, p.name, p.profile_path, mcr.job, mcr.department
      FROM movie_crew mcr
      JOIN people p ON p.id = mcr.person_id
      WHERE mcr.movie_id = ?
      ORDER BY mcr.department ASC
    `).all(id) as Array<{ person_id: number; name: string; profile_path: string | null; job: string | null; department: string | null }>;

    const keywords = sqlite.prepare(`
      SELECT k.id, k.name FROM keywords k
      JOIN movie_keywords mk ON mk.keyword_id = k.id
      WHERE mk.movie_id = ?
    `).all(id) as Array<{ id: number; name: string }>;

    const production_companies = sqlite.prepare(`
      SELECT pc.id, pc.name, pc.logo_path, pc.origin_country
      FROM production_companies pc
      JOIN movie_production_companies mpc ON mpc.company_id = pc.id
      WHERE mpc.movie_id = ?
    `).all(id) as Array<{ id: number; name: string; logo_path: string | null; origin_country: string | null }>;

    return {
      id: movie.id as number,
      tmdb_id: movie.tmdb_id as number,
      title: movie.title as string,
      original_title: movie.original_title as string | null,
      overview: movie.overview as string | null,
      poster_path: movie.poster_path as string | null,
      backdrop_path: movie.backdrop_path as string | null,
      release_date: movie.release_date as string | null,
      status: movie.status as string | null,
      runtime: movie.runtime as number | null,
      vote_average: movie.vote_average as number | null,
      vote_count: movie.vote_count as number | null,
      popularity: movie.popularity as number | null,
      budget: movie.budget as number | null,
      revenue: movie.revenue as number | null,
      original_language: movie.original_language as string | null,
      spoken_languages: movie.spoken_languages as string | null,
      tagline: movie.tagline as string | null,
      homepage: movie.homepage as string | null,
      imdb_id: movie.imdb_id as string | null,
      genres,
      cast,
      crew,
      keywords,
      production_companies,
    };
  }

  // ─── getTvSeriesById ──────────────────────────────────────────────────────

  getTvSeriesById(id: number): TvSeriesDetail | undefined {
    const series = sqlite.prepare(`
      SELECT * FROM tv_series WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!series) return undefined;

    const genres = sqlite.prepare(`
      SELECT g.id, g.name FROM genres g
      JOIN tv_series_genres tsg ON tsg.genre_id = g.id
      WHERE tsg.tv_series_id = ?
    `).all(id) as Array<{ id: number; name: string }>;

    const cast = sqlite.prepare(`
      SELECT tsc.person_id, p.name, p.profile_path, tsc.character, tsc.display_order
      FROM tv_series_cast tsc
      JOIN people p ON p.id = tsc.person_id
      WHERE tsc.tv_series_id = ?
      ORDER BY tsc.display_order ASC
    `).all(id) as Array<{ person_id: number; name: string; profile_path: string | null; character: string | null; display_order: number | null }>;

    const crew = sqlite.prepare(`
      SELECT tscr.person_id, p.name, p.profile_path, tscr.job, tscr.department
      FROM tv_series_crew tscr
      JOIN people p ON p.id = tscr.person_id
      WHERE tscr.tv_series_id = ?
      ORDER BY tscr.department ASC
    `).all(id) as Array<{ person_id: number; name: string; profile_path: string | null; job: string | null; department: string | null }>;

    return {
      id: series.id as number,
      tmdb_id: series.tmdb_id as number,
      name: series.name as string,
      original_name: series.original_name as string | null,
      overview: series.overview as string | null,
      poster_path: series.poster_path as string | null,
      backdrop_path: series.backdrop_path as string | null,
      first_air_date: series.first_air_date as string | null,
      last_air_date: series.last_air_date as string | null,
      status: series.status as string | null,
      number_of_seasons: series.number_of_seasons as number | null,
      number_of_episodes: series.number_of_episodes as number | null,
      episode_run_time: series.episode_run_time as string | null,
      vote_average: series.vote_average as number | null,
      vote_count: series.vote_count as number | null,
      popularity: series.popularity as number | null,
      original_language: series.original_language as string | null,
      spoken_languages: series.spoken_languages as string | null,
      tagline: series.tagline as string | null,
      homepage: series.homepage as string | null,
      networks: series.networks as string | null,
      genres,
      cast,
      crew,
    };
  }

  // ─── getPersonById ────────────────────────────────────────────────────────

  getPersonById(id: number): PersonDetail | undefined {
    const person = sqlite.prepare(`
      SELECT * FROM people WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!person) return undefined;

    const movie_credits = sqlite.prepare(`
      SELECT
        mc.movie_id, m.tmdb_id, m.title, m.poster_path, m.release_date,
        mc.character, NULL AS job, 'cast' AS role
      FROM movie_cast mc
      JOIN movies m ON m.id = mc.movie_id
      WHERE mc.person_id = ?
      UNION ALL
      SELECT
        mcr.movie_id, m.tmdb_id, m.title, m.poster_path, m.release_date,
        NULL AS character, mcr.job, 'crew' AS role
      FROM movie_crew mcr
      JOIN movies m ON m.id = mcr.movie_id
      WHERE mcr.person_id = ?
      ORDER BY release_date DESC
    `).all(id, id) as Array<{
      movie_id: number;
      tmdb_id: number;
      title: string;
      poster_path: string | null;
      release_date: string | null;
      character: string | null;
      job: string | null;
      role: "cast" | "crew";
    }>;

    const tv_credits = sqlite.prepare(`
      SELECT
        tsc.tv_series_id, t.tmdb_id, t.name, t.poster_path, t.first_air_date,
        tsc.character, NULL AS job, 'cast' AS role
      FROM tv_series_cast tsc
      JOIN tv_series t ON t.id = tsc.tv_series_id
      WHERE tsc.person_id = ?
      UNION ALL
      SELECT
        tscr.tv_series_id, t.tmdb_id, t.name, t.poster_path, t.first_air_date,
        NULL AS character, tscr.job, 'crew' AS role
      FROM tv_series_crew tscr
      JOIN tv_series t ON t.id = tscr.tv_series_id
      WHERE tscr.person_id = ?
      ORDER BY first_air_date DESC
    `).all(id, id) as Array<{
      tv_series_id: number;
      tmdb_id: number;
      name: string;
      poster_path: string | null;
      first_air_date: string | null;
      character: string | null;
      job: string | null;
      role: "cast" | "crew";
    }>;

    return {
      id: person.id as number,
      tmdb_id: person.tmdb_id as number,
      name: person.name as string,
      profile_path: person.profile_path as string | null,
      known_for_department: person.known_for_department as string | null,
      movie_credits,
      tv_credits,
    };
  }

  // ─── getTrending ──────────────────────────────────────────────────────────

  getTrending(type: "movie" | "tv", limit: number): SearchResult[] {
    if (type === "movie") {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies
        ORDER BY popularity DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];
      return rows.map(r => this.mapMovieRow(r));
    } else {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series
        ORDER BY popularity DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];
      return rows.map(r => this.mapTvRow(r));
    }
  }

  // ─── getTopRated ──────────────────────────────────────────────────────────

  getTopRated(type: "movie" | "tv", limit: number): SearchResult[] {
    if (type === "movie") {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies
        WHERE vote_count > 50
        ORDER BY vote_average DESC, vote_count DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];
      return rows.map(r => this.mapMovieRow(r));
    } else {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series
        WHERE vote_count > 50
        ORDER BY vote_average DESC, vote_count DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];
      return rows.map(r => this.mapTvRow(r));
    }
  }

  // ─── getRecent ────────────────────────────────────────────────────────────

  getRecent(type: "movie" | "tv", limit: number): SearchResult[] {
    // Last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const cutoff = threeMonthsAgo.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    if (type === "movie") {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies
        WHERE release_date >= ? AND release_date <= ?
        ORDER BY release_date DESC
        LIMIT ?
      `).all(cutoff, today, limit) as Record<string, unknown>[];
      return rows.map(r => this.mapMovieRow(r));
    } else {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series
        WHERE first_air_date >= ? AND first_air_date <= ?
        ORDER BY first_air_date DESC
        LIMIT ?
      `).all(cutoff, today, limit) as Record<string, unknown>[];
      return rows.map(r => this.mapTvRow(r));
    }
  }

  // ─── getUpcoming ──────────────────────────────────────────────────────────

  getUpcoming(type: "movie" | "tv", limit: number): SearchResult[] {
    const today = new Date().toISOString().slice(0, 10);

    if (type === "movie") {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies
        WHERE release_date > ? OR status = 'Post Production' OR status = 'In Production'
        ORDER BY release_date ASC
        LIMIT ?
      `).all(today, limit) as Record<string, unknown>[];
      return rows.map(r => this.mapMovieRow(r));
    } else {
      const rows = sqlite.prepare(`
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series
        WHERE first_air_date > ? OR status = 'In Production' OR status = 'Planned'
        ORDER BY first_air_date ASC
        LIMIT ?
      `).all(today, limit) as Record<string, unknown>[];
      return rows.map(r => this.mapTvRow(r));
    }
  }

  // ─── autocompletePeople ───────────────────────────────────────────────────

  autocompletePeople(
    query: string,
    limit: number
  ): Array<{ id: number; name: string; profile_path: string | null; known_for_department: string | null }> {
    const rows = sqlite.prepare(`
      SELECT id, name, profile_path, known_for_department
      FROM people
      WHERE name LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `).all(`%${query}%`, limit) as Array<{
      id: number;
      name: string;
      profile_path: string | null;
      known_for_department: string | null;
    }>;
    return rows;
  }

  // ─── autocompleteKeywords ─────────────────────────────────────────────────

  autocompleteKeywords(
    query: string,
    limit: number
  ): Array<{ id: number; name: string }> {
    const rows = sqlite.prepare(`
      SELECT id, name
      FROM keywords
      WHERE name LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `).all(`%${query}%`, limit) as Array<{ id: number; name: string }>;
    return rows;
  }

  // ─── getStats ─────────────────────────────────────────────────────────────

  getStats(): Stats {
    const movieCount = (sqlite.prepare(`SELECT COUNT(*) AS c FROM movies`).get() as { c: number }).c;
    const tvCount = (sqlite.prepare(`SELECT COUNT(*) AS c FROM tv_series`).get() as { c: number }).c;
    const genresCount = (sqlite.prepare(`SELECT COUNT(*) AS c FROM genres`).get() as { c: number }).c;
    const peopleCount = (sqlite.prepare(`SELECT COUNT(*) AS c FROM people`).get() as { c: number }).c;

    const syncRow = sqlite.prepare(`
      SELECT last_sync_date FROM sync_state WHERE id = 1
    `).get() as { last_sync_date: string | null } | undefined;

    return {
      total_movies: movieCount,
      total_tv_series: tvCount,
      last_sync: syncRow?.last_sync_date ?? null,
      genres_count: genresCount,
      people_count: peopleCount,
    };
  }

  // ─── Image cache methods ──────────────────────────────────────────────────

  getCachedImage(
    mediaType: "movie" | "tv",
    mediaId: number,
    imageType: "poster" | "backdrop",
    size: string
  ): { image_data: Buffer; content_type: string } | null {
    const row = sqlite
      .prepare(
        `SELECT image_data, content_type FROM image_cache
         WHERE media_type = ? AND media_id = ? AND image_type = ? AND size = ?
         LIMIT 1`
      )
      .get(mediaType, mediaId, imageType, size) as
      | { image_data: Buffer; content_type: string }
      | undefined;
    return row ?? null;
  }

  cacheImage(
    mediaType: string,
    mediaId: number,
    imageType: string,
    size: string,
    tmdbPath: string | null,
    imageData: Buffer,
    contentType: string,
    fileSize: number
  ): void {
    sqlite
      .prepare(
        `INSERT OR REPLACE INTO image_cache
           (media_type, media_id, image_type, size, tmdb_path, image_data, content_type, file_size, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(mediaType, mediaId, imageType, size, tmdbPath, imageData, contentType, fileSize);
  }

  getTmdbImagePath(
    mediaType: "movie" | "tv",
    mediaId: number,
    imageType: "poster" | "backdrop"
  ): string | null {
    const column = imageType === "poster" ? "poster_path" : "backdrop_path";
    const table = mediaType === "movie" ? "movies" : "tv_series";
    const row = sqlite
      .prepare(`SELECT ${column} FROM ${table} WHERE id = ?`)
      .get(mediaId) as Record<string, string | null> | undefined;
    return row?.[column] ?? null;
  }
}

export const storage = new DatabaseStorage();
