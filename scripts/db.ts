/**
 * Shared database utility for standalone scripts.
 * Creates/opens the SQLite database and applies schema migrations if needed.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDir, "scifionly.db");

const sqlite = new Database(dbPath);

// Performance pragmas
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = -64000");
sqlite.pragma("mmap_size = 268435456");

// ─────────────────────────────────────────────
// Schema bootstrap — idempotent (CREATE IF NOT EXISTS)
// ─────────────────────────────────────────────

sqlite.exec(`
  -- Reference tables
  CREATE TABLE IF NOT EXISTS genres (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS people (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id              INTEGER NOT NULL UNIQUE,
    name                 TEXT NOT NULL,
    profile_path         TEXT,
    known_for_department TEXT
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

  -- Main content tables
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
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id),
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

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id        ON movies(tmdb_id);
  CREATE INDEX IF NOT EXISTS idx_movies_release_date   ON movies(release_date);
  CREATE INDEX IF NOT EXISTS idx_movies_popularity     ON movies(popularity DESC);
  CREATE INDEX IF NOT EXISTS idx_movies_vote_average   ON movies(vote_average DESC);
  CREATE INDEX IF NOT EXISTS idx_movies_status         ON movies(status);
  CREATE INDEX IF NOT EXISTS idx_movies_original_language ON movies(original_language);

  CREATE INDEX IF NOT EXISTS idx_tv_series_tmdb_id     ON tv_series(tmdb_id);
  CREATE INDEX IF NOT EXISTS idx_tv_series_first_air_date ON tv_series(first_air_date);
  CREATE INDEX IF NOT EXISTS idx_tv_series_popularity  ON tv_series(popularity DESC);
  CREATE INDEX IF NOT EXISTS idx_tv_series_vote_average ON tv_series(vote_average DESC);
  CREATE INDEX IF NOT EXISTS idx_tv_series_status      ON tv_series(status);
  CREATE INDEX IF NOT EXISTS idx_tv_series_original_language ON tv_series(original_language);

  CREATE INDEX IF NOT EXISTS idx_people_tmdb_id ON people(tmdb_id);
  CREATE INDEX IF NOT EXISTS idx_people_name    ON people(name);

  CREATE INDEX IF NOT EXISTS idx_movie_cast_person ON movie_cast(person_id);
  CREATE INDEX IF NOT EXISTS idx_movie_crew_person ON movie_crew(person_id);
  CREATE INDEX IF NOT EXISTS idx_movie_crew_job    ON movie_crew(job);
  CREATE INDEX IF NOT EXISTS idx_tv_cast_person    ON tv_series_cast(person_id);
  CREATE INDEX IF NOT EXISTS idx_tv_crew_person    ON tv_series_crew(person_id);
`);

// FTS5 virtual tables (must be created separately — no IF NOT EXISTS in older SQLite)
const hasFtsMovies = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movies_fts'")
  .get();

if (!hasFtsMovies) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE movies_fts USING fts5(
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

    CREATE TRIGGER movies_ai AFTER INSERT ON movies BEGIN
      INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES (new.id, new.title, new.original_title, new.overview, new.tagline,
              COALESCE(new.cast_names,''), COALESCE(new.crew_names,''), COALESCE(new.keyword_names,''));
    END;

    CREATE TRIGGER movies_ad AFTER DELETE ON movies BEGIN
      INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline,
              COALESCE(old.cast_names,''), COALESCE(old.crew_names,''), COALESCE(old.keyword_names,''));
    END;

    CREATE TRIGGER movies_au AFTER UPDATE ON movies BEGIN
      INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline,
              COALESCE(old.cast_names,''), COALESCE(old.crew_names,''), COALESCE(old.keyword_names,''));
      INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES (new.id, new.title, new.original_title, new.overview, new.tagline,
              COALESCE(new.cast_names,''), COALESCE(new.crew_names,''), COALESCE(new.keyword_names,''));
    END;
  `);
}

const hasFtsTv = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tv_series_fts'")
  .get();

if (!hasFtsTv) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE tv_series_fts USING fts5(
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

    CREATE TRIGGER tv_series_ai AFTER INSERT ON tv_series BEGIN
      INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES (new.id, new.name, new.original_name, new.overview, new.tagline,
              COALESCE(new.cast_names,''), COALESCE(new.crew_names,''), COALESCE(new.keyword_names,''));
    END;

    CREATE TRIGGER tv_series_ad AFTER DELETE ON tv_series BEGIN
      INSERT INTO tv_series_fts(tv_series_fts, rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES ('delete', old.id, old.name, old.original_name, old.overview, old.tagline,
              COALESCE(old.cast_names,''), COALESCE(old.crew_names,''), COALESCE(old.keyword_names,''));
    END;

    CREATE TRIGGER tv_series_au AFTER UPDATE ON tv_series BEGIN
      INSERT INTO tv_series_fts(tv_series_fts, rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES ('delete', old.id, old.name, old.original_name, old.overview, old.tagline,
              COALESCE(old.cast_names,''), COALESCE(old.crew_names,''), COALESCE(old.keyword_names,''));
      INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names)
      VALUES (new.id, new.name, new.original_name, new.overview, new.tagline,
              COALESCE(new.cast_names,''), COALESCE(new.crew_names,''), COALESCE(new.keyword_names,''));
    END;
  `);
}

export default sqlite;
