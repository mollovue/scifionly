# SciFi Only — Database Schema Specification

## Overview

The database stores all sci-fi related content sourced from TMDB, optimized for multi-criteria search across movies and TV series. SQLite with FTS5 full-text search provides the search backbone.

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     movies       │────▶│  movie_genres     │◀────│     genres       │
│                  │     └──────────────────┘     └─────────────────┘
│  id (PK)         │
│  tmdb_id (UNQ)   │     ┌──────────────────┐     ┌─────────────────┐
│  title           │────▶│  movie_cast       │◀────│     people       │
│  original_title  │     └──────────────────┘     │                  │
│  overview        │                               │  id (PK)         │
│  poster_path     │     ┌──────────────────┐     │  tmdb_id (UNQ)   │
│  backdrop_path   │────▶│  movie_crew       │◀────│  name            │
│  release_date    │     └──────────────────┘     │  profile_path    │
│  status          │                               │  known_for_dept  │
│  runtime         │     ┌──────────────────┐     └─────────────────┘
│  vote_average    │────▶│movie_keywords     │◀────┌─────────────────┐
│  vote_count      │     └──────────────────┘     │    keywords      │
│  popularity      │                               └─────────────────┘
│  budget          │     ┌──────────────────┐
│  revenue         │────▶│movie_prod_companies│◀───┌─────────────────┐
│  original_lang   │     └──────────────────┘     │prod_companies    │
│  spoken_langs    │                               └─────────────────┘
│  tagline         │
│  homepage        │
│  imdb_id         │
│  tmdb_updated_at │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│   tv_series      │────▶│ tv_series_genres  │──▶ genres
│                  │     └──────────────────┘
│  id (PK)         │     ┌──────────────────┐
│  tmdb_id (UNQ)   │────▶│ tv_series_cast    │──▶ people
│  name            │     └──────────────────┘
│  original_name   │     ┌──────────────────┐
│  overview        │────▶│ tv_series_crew    │──▶ people
│  poster_path     │     └──────────────────┘
│  backdrop_path   │
│  first_air_date  │
│  last_air_date   │
│  status          │
│  number_of_seasons│
│  number_of_episodes│
│  episode_run_time│
│  vote_average    │
│  vote_count      │
│  popularity      │
│  original_lang   │
│  spoken_langs    │
│  tagline         │
│  homepage        │
│  networks        │
│  tmdb_updated_at │
└─────────────────┘

┌─────────────────┐
│   sync_state     │  (singleton table for tracking sync progress)
│  id (PK)         │
│  last_sync_date  │
│  last_sync_type  │
│  total_movies    │
│  total_tv_series │
│  last_change_date│
│  updated_at      │
└─────────────────┘
```

## Table Definitions

### `movies`
Primary table for sci-fi movies.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal ID |
| tmdb_id | INTEGER | UNIQUE NOT NULL | TMDB movie ID |
| title | TEXT | NOT NULL | Display title (translated) |
| original_title | TEXT | | Original language title |
| overview | TEXT | | Plot synopsis |
| poster_path | TEXT | | TMDB poster image path |
| backdrop_path | TEXT | | TMDB backdrop image path |
| release_date | TEXT | | Release date (YYYY-MM-DD) |
| status | TEXT | | Release status (Released, Post Production, etc.) |
| runtime | INTEGER | | Duration in minutes |
| vote_average | REAL | | Average TMDB rating (0-10) |
| vote_count | INTEGER | | Number of TMDB votes |
| popularity | REAL | | TMDB popularity score |
| budget | INTEGER | | Budget in USD |
| revenue | INTEGER | | Revenue in USD |
| original_language | TEXT | | ISO 639-1 language code |
| spoken_languages | TEXT | | JSON array of language codes |
| tagline | TEXT | | Movie tagline |
| homepage | TEXT | | Official website URL |
| imdb_id | TEXT | | IMDB identifier |
| tmdb_updated_at | TEXT | | Last update timestamp from TMDB |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Record update time |

### `tv_series`
Primary table for sci-fi TV series.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal ID |
| tmdb_id | INTEGER | UNIQUE NOT NULL | TMDB TV series ID |
| name | TEXT | NOT NULL | Display name |
| original_name | TEXT | | Original language name |
| overview | TEXT | | Series synopsis |
| poster_path | TEXT | | TMDB poster image path |
| backdrop_path | TEXT | | TMDB backdrop image path |
| first_air_date | TEXT | | First air date (YYYY-MM-DD) |
| last_air_date | TEXT | | Last air date (YYYY-MM-DD) |
| status | TEXT | | Status (Returning Series, Ended, Canceled, etc.) |
| number_of_seasons | INTEGER | | Total seasons |
| number_of_episodes | INTEGER | | Total episodes |
| episode_run_time | TEXT | | JSON array of typical runtimes |
| vote_average | REAL | | Average TMDB rating (0-10) |
| vote_count | INTEGER | | Number of TMDB votes |
| popularity | REAL | | TMDB popularity score |
| original_language | TEXT | | ISO 639-1 language code |
| spoken_languages | TEXT | | JSON array of language codes |
| tagline | TEXT | | Series tagline |
| homepage | TEXT | | Official website URL |
| networks | TEXT | | JSON array of network names |
| tmdb_updated_at | TEXT | | Last update timestamp |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | |

### `genres`
Shared genre reference table.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY | TMDB genre ID (used as PK directly) |
| name | TEXT | NOT NULL | Genre name |

### `people`
Cast and crew members.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal ID |
| tmdb_id | INTEGER | UNIQUE NOT NULL | TMDB person ID |
| name | TEXT | NOT NULL | Full name |
| profile_path | TEXT | | TMDB profile image path |
| known_for_department | TEXT | | Primary department (Acting, Directing, etc.) |

### `keywords`
TMDB keyword tags.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY | TMDB keyword ID |
| name | TEXT | NOT NULL | Keyword text |

### `production_companies`
Production companies.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY | TMDB company ID |
| name | TEXT | NOT NULL | Company name |
| logo_path | TEXT | | TMDB logo image path |
| origin_country | TEXT | | Country of origin |

### Junction Tables

#### `movie_genres`
| Column | Type | Constraints |
|---|---|---|
| movie_id | INTEGER | FK → movies.id ON DELETE CASCADE |
| genre_id | INTEGER | FK → genres.id |
| PRIMARY KEY | | (movie_id, genre_id) |

#### `movie_cast`
| Column | Type | Constraints | Description |
|---|---|---|---|
| movie_id | INTEGER | FK → movies.id ON DELETE CASCADE | |
| person_id | INTEGER | FK → people.id | |
| character | TEXT | | Character name |
| display_order | INTEGER | | Cast billing order |
| PRIMARY KEY | | (movie_id, person_id, character) | |

#### `movie_crew`
| Column | Type | Constraints | Description |
|---|---|---|---|
| movie_id | INTEGER | FK → movies.id ON DELETE CASCADE | |
| person_id | INTEGER | FK → people.id | |
| job | TEXT | | Job title (Director, Producer, etc.) |
| department | TEXT | | Department (Directing, Production, etc.) |
| PRIMARY KEY | | (movie_id, person_id, job) | |

#### `movie_keywords`
| Column | Type | Constraints |
|---|---|---|
| movie_id | INTEGER | FK → movies.id ON DELETE CASCADE |
| keyword_id | INTEGER | FK → keywords.id |
| PRIMARY KEY | | (movie_id, keyword_id) |

#### `movie_production_companies`
| Column | Type | Constraints |
|---|---|---|
| movie_id | INTEGER | FK → movies.id ON DELETE CASCADE |
| company_id | INTEGER | FK → production_companies.id |
| PRIMARY KEY | | (movie_id, company_id) |

#### `tv_series_genres`
| Column | Type | Constraints |
|---|---|---|
| tv_series_id | INTEGER | FK → tv_series.id ON DELETE CASCADE |
| genre_id | INTEGER | FK → genres.id |
| PRIMARY KEY | | (tv_series_id, genre_id) |

#### `tv_series_cast`
| Column | Type | Constraints | Description |
|---|---|---|---|
| tv_series_id | INTEGER | FK → tv_series.id ON DELETE CASCADE | |
| person_id | INTEGER | FK → people.id | |
| character | TEXT | | Character name |
| display_order | INTEGER | | Cast billing order |
| PRIMARY KEY | | (tv_series_id, person_id, character) | |

#### `tv_series_crew`
| Column | Type | Constraints | Description |
|---|---|---|---|
| tv_series_id | INTEGER | FK → tv_series.id ON DELETE CASCADE | |
| person_id | INTEGER | FK → people.id | |
| job | TEXT | | Job title |
| department | TEXT | | Department |
| PRIMARY KEY | | (tv_series_id, person_id, job) | |

### `sync_state`
Tracks integration sync progress.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY DEFAULT 1 | Singleton row |
| last_sync_date | TEXT | | Date of last completed sync (YYYY-MM-DD) |
| last_sync_type | TEXT | | 'initial' or 'incremental' |
| total_movies | INTEGER | DEFAULT 0 | Total movies in database |
| total_tv_series | INTEGER | DEFAULT 0 | Total TV series in database |
| last_change_date | TEXT | | Last processed TMDB change date |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | |

## Full-Text Search (FTS5)

Two FTS5 virtual tables provide fast text search:

### `movies_fts`
```sql
CREATE VIRTUAL TABLE movies_fts USING fts5(
  title,
  original_title,
  overview,
  tagline,
  cast_names,      -- denormalized: comma-separated cast names
  crew_names,      -- denormalized: comma-separated crew names (directors, etc.)
  keyword_names,   -- denormalized: comma-separated keyword names
  content=movies,
  content_rowid=id,
  tokenize='porter unicode61'
);
```

### `tv_series_fts`
```sql
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
```

**Tokenizer**: `porter unicode61` — Porter stemming for English + Unicode support for international titles.

**FTS Sync Strategy**: FTS tables are content-synced with the main tables. After any insert/update/delete on movies or tv_series, the corresponding FTS row is updated via triggers:

```sql
CREATE TRIGGER movies_ai AFTER INSERT ON movies BEGIN
  INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
  VALUES (new.id, new.title, new.original_title, new.overview, new.tagline, '', '', '');
END;

CREATE TRIGGER movies_ad AFTER DELETE ON movies BEGIN
  INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
  VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline, '', '', '');
END;

CREATE TRIGGER movies_au AFTER UPDATE ON movies BEGIN
  INSERT INTO movies_fts(movies_fts, rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
  VALUES ('delete', old.id, old.title, old.original_title, old.overview, old.tagline, '', '', '');
  INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names)
  VALUES (new.id, new.title, new.original_title, new.overview, new.tagline, '', '', '');
END;
```

The denormalized `cast_names`, `crew_names`, and `keyword_names` fields are populated by the sync scripts after all junction table data is loaded.

## Indexes

```sql
-- Movies
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_movies_release_date ON movies(release_date);
CREATE INDEX idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX idx_movies_status ON movies(status);
CREATE INDEX idx_movies_original_language ON movies(original_language);

-- TV Series
CREATE INDEX idx_tv_series_tmdb_id ON tv_series(tmdb_id);
CREATE INDEX idx_tv_series_first_air_date ON tv_series(first_air_date);
CREATE INDEX idx_tv_series_popularity ON tv_series(popularity DESC);
CREATE INDEX idx_tv_series_vote_average ON tv_series(vote_average DESC);
CREATE INDEX idx_tv_series_status ON tv_series(status);
CREATE INDEX idx_tv_series_original_language ON tv_series(original_language);

-- People
CREATE INDEX idx_people_tmdb_id ON people(tmdb_id);
CREATE INDEX idx_people_name ON people(name);

-- Junction tables (additional indexes beyond PKs)
CREATE INDEX idx_movie_cast_person ON movie_cast(person_id);
CREATE INDEX idx_movie_crew_person ON movie_crew(person_id);
CREATE INDEX idx_movie_crew_job ON movie_crew(job);
CREATE INDEX idx_tv_cast_person ON tv_series_cast(person_id);
CREATE INDEX idx_tv_crew_person ON tv_series_crew(person_id);
```

## SQLite Configuration

```sql
PRAGMA journal_mode = WAL;          -- Write-Ahead Logging for concurrent reads
PRAGMA synchronous = NORMAL;        -- Balance of safety and performance
PRAGMA foreign_keys = ON;           -- Enforce referential integrity
PRAGMA cache_size = -64000;         -- 64MB page cache
PRAGMA mmap_size = 268435456;       -- 256MB memory-mapped I/O
```
