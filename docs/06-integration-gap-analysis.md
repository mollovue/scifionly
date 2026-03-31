# SciFi Only — Integration Gap Analysis Report

## Purpose

This report documents the gaps between the initial implementation and the goal of ensuring that **all sci-fi movies and TV series are visible to users when they browse the Web App**, without requiring a live TMDB API key at deploy time.

## Goal

When a user opens the SciFi Only web app after a fresh deployment, they should see all sci-fi movies and TV series populated in the Browse page and searchable via the Search interface. This requires:

1. **Objective 1**: Sci-fi related data from TMDB is collected via the integration's initial load.
2. **Objective 2**: All collected data is stored in the repo as "seed data".
3. **Objective 3**: All seed data is loaded into the database when the Web App is deployed.

## Current State Analysis

### What Was Already Implemented (Before This Work)

| Component | Status | Details |
|---|---|---|
| TMDB client (`scripts/tmdb-client.ts`) | Complete | Rate limiting, retries, all TMDB API methods |
| Initial sync script (`scripts/sync-initial.ts`) | Complete | Discovers sci-fi IDs via `/discover`, fetches full details, persists to DB |
| Incremental sync script (`scripts/sync-incremental.ts`) | Complete | Processes TMDB Changes API, upserts/removes sci-fi entries |
| Sync status script (`scripts/sync-status.ts`) | Complete | Reports DB counts and sync health |
| Database schema (`scripts/db.ts`) | Complete | All tables, FTS5, indexes, triggers — created on first use |
| Server storage layer (`server/storage.ts`) | Complete | Search, browse, detail, autocomplete, image cache queries |
| Server API routes (`server/routes.ts`) | Complete | All endpoints: search, movies, TV, people, autocomplete, images, stats |
| Web app frontend (Browse, Search, Detail pages) | Complete | Fetches from API, renders content cards, detail views |
| Demo seed script (`scripts/seed-demo.ts`) | Complete | Inserts ~20 hardcoded movies and ~10 TV series with fabricated data |
| Image caching (`server/image-fetcher.ts`) | Complete | Lazy-load on-demand image caching from TMDB CDN |

## Identified Gaps

### Gap 1: TMDB Initial Sync Had Never Been Executed

**Problem**: The `sync-initial.ts` script was fully implemented but had never been run against the TMDB API. There was no SQLite database file with real sci-fi data.

**Impact**: The web app started with an empty database. The Browse page showed "No content available" for all rows. Search returned zero results.

**Root Cause**: Running the initial sync requires a `TMDB_API_KEY` environment variable and takes significant time (thousands of API calls with rate limiting). This had not been done as part of the project setup.

**Resolution**: ✅ **RESOLVED** — See "Resolution Details" below.

### Gap 2: No Seed Data Stored in the Repository

**Problem**: The `.gitignore` file excluded `data/` and `*.db`, which meant the SQLite database created by the sync could not be committed to the repository. Even if the sync was run, the resulting data was local-only and lost when the repo was cloned fresh.

**Impact**: Every fresh clone of the repository started with zero data. The only way to populate it was to run the initial sync, which requires a TMDB API key and significant time.

**Why the existing demo seeder was insufficient**: `scripts/seed-demo.ts` contains only ~20 hardcoded movies and ~10 TV series with manually created data. This is useful for development/testing but does not represent the full TMDB sci-fi catalog (thousands of entries).

**Resolution**: ✅ **RESOLVED** — See "Resolution Details" below.

### Gap 3: No Automatic Seed Data Loading on Deployment

**Problem**: When the web app server started (`server/index.ts`), it did not check whether the database was empty and did not attempt to load seed data.

**Impact**: A fresh deployment resulted in an empty database with no content visible to users.

**Resolution**: ✅ **RESOLVED** — See "Resolution Details" below.

## Resolution Details

All three gaps have been resolved. Below is what was implemented.

### Gap 1 Resolution: Initial Sync Executed

The existing `sync-initial.ts` was too slow for practical use (~300ms per API call, serial processing, estimated ~50 minutes for full load). A parallel sync script was created:

- **`scripts/sync-fast.ts`** — Processes TMDB API calls with 8 concurrent requests, reducing total sync time from ~50 minutes to ~18 minutes.
- The initial sync was executed on 2026-03-31, collecting:
  - **9,881 movies** (TMDB Sci-Fi genre ID: 878)
  - **8,790 TV series** (TMDB Sci-Fi & Fantasy genre ID: 10765)
  - **128,841 people** (cast and crew)
  - **9,136 keywords**, **27 genres**, **9,077 production companies**
- FTS5 full-text search indexes were built with triggers for automatic maintenance.

### Gap 2 Resolution: Seed Data Exported and Stored

- **`scripts/export-seed.ts`** — Exports the populated database as a gzip-compressed SQLite file to `data/seed/scifionly-seed.db.gz`.
- The seed file is **35 MB** (compressed from 63.7 MB uncompressed).
- **`.gitignore`** was updated: changed from blanket `data/` exclusion to specific patterns (`data/*.db`, `data/*.db-journal`, `data/*.db-wal`, `data/*.db-shm`), with `!data/seed/` explicitly un-ignored so the seed directory is tracked in Git.
- **`scripts/import-seed.ts`** — Standalone script to import seed data. Supports `--force` flag to overwrite an existing database.

### Gap 3 Resolution: Automatic Seed Loading on Server Startup

- **`server/storage.ts`** was modified to include a `loadSeedDataIfNeeded()` function that runs at module load time (before the server starts accepting requests).
- The function detects an empty database by checking:
  1. Whether the DB file exists
  2. Whether the `movies` table exists
  3. Whether the `movies` table has any rows
- If the database is empty and `data/seed/scifionly-seed.db.gz` exists, it decompresses the seed file directly as the database file using `gunzip -c`.
- On a fresh clone, the first `npm run dev` automatically restores the full 63.7 MB database from the seed file in seconds.

### End-to-End Verification

The following was verified after deleting the database and starting the server fresh:

1. Server startup log: `[storage] Database is empty — loading seed data... Seed data loaded: 63.7 MB`
2. Homepage displays: "9,881 Movies | 8,790 TV Series | Synced: 3/31/2026"
3. Browse page shows all sections populated: Trending Movies, Top Rated Movies, Recently Released, Trending TV Series, Top Rated TV Series
4. Movie cards display correctly with poster images, titles, years, and ratings
5. TV series cards display correctly with poster images, titles, years, and ratings
6. API endpoints (`/api/stats`, `/api/movies/trending`, `/api/tv/trending`, etc.) return data

## Files Changed

| File | Action | Purpose |
|---|---|---|
| `scripts/sync-fast.ts` | Created | Parallel initial sync (8 concurrent TMDB API calls) |
| `scripts/export-seed.ts` | Created | Exports populated DB as compressed seed file |
| `scripts/import-seed.ts` | Created | Imports seed data (supports `--force` flag) |
| `server/storage.ts` | Modified | Auto-load seed data on empty DB at server startup |
| `.gitignore` | Modified | Allow `data/seed/` to be tracked, ignore only `data/*.db` files |
| `package.json` | Modified | Added `seed:export`, `seed:import`, `sync:initial`, `sync:status` scripts |
| `data/seed/scifionly-seed.db.gz` | Created (generated) | 35 MB compressed seed database |
| `docs/06-integration-gap-analysis.md` | Created | This document |

## NPM Scripts Added

| Script | Command | Purpose |
|---|---|---|
| `npm run sync:initial` | `tsx scripts/sync-fast.ts` | Run full TMDB sync (requires `TMDB_API_KEY` in `.env`) |
| `npm run sync:status` | `tsx scripts/sync-status.ts` | Check sync health and DB stats |
| `npm run seed:export` | `tsx scripts/export-seed.ts` | Export current DB as compressed seed |
| `npm run seed:import` | `tsx scripts/import-seed.ts` | Import seed data into empty DB |

## Risks and Considerations

1. **Seed data file size**: The compressed seed file is 35 MB. This is within Git's limits but may benefit from Git LFS for better clone performance.
2. **TMDB API key requirement**: The initial sync requires a one-time TMDB API key. This is a runtime dependency for data collection, not for deployment. The seed file eliminates this requirement for most users.
3. **Data freshness**: Seed data is a point-in-time snapshot (2026-03-31). To refresh: run `npm run sync:initial` (with TMDB API key), then `npm run seed:export` to update the seed file.
4. **Incremental sync**: The `sync-incremental.ts` script exists for ongoing updates but was not the focus of this work (per requirements: "Ignore the incremental updates via API. Focus on full load.").
