# SciFi Only — Integration Tool Specification

## Overview

The integration tool extracts all available sci-fi related content from TMDB and loads it into the SciFi Only database. It uses a **hybrid approach**: TMDB daily file exports for initial bulk load + TMDB API for incremental daily updates.

## Data Source Analysis

### TMDB Daily File Exports
- **URL**: `https://files.tmdb.org/p/exports/`
- **Format**: Gzipped JSONL (one JSON object per line)
- **Schedule**: Generated daily ~7:00 AM UTC, available by 8:00 AM UTC
- **Retention**: Files available for 3 months
- **Content**: ID lists with basic metadata (id, adult, popularity, video flags)
- **No authentication required**
- **Limitation**: NOT full data exports — only IDs and high-level attributes

### TMDB API v3
- **Base URL**: `https://api.themoviedb.org/3`
- **Auth**: Bearer token in Authorization header
- **Rate limit**: ~40 requests per 10 seconds (varies)
- **Pagination**: Page-based, max 500 pages per discover query (10,000 results)
- **Key endpoints**:
  - `GET /discover/movie?with_genres=878` — Discover sci-fi movies (genre ID 878)
  - `GET /discover/tv?with_genres=10765` — Discover sci-fi TV (genre ID 10765)
  - `GET /movie/{id}?append_to_response=credits,keywords` — Full movie details
  - `GET /tv/{id}?append_to_response=credits,keywords` — Full TV details
  - `GET /movie/changes?start_date=X&end_date=Y` — Changed movie IDs (max 14-day window)
  - `GET /tv/changes?start_date=X&end_date=Y` — Changed TV series IDs

### Chosen Strategy: Hybrid Approach

| Phase | Method | Rationale |
|---|---|---|
| **Initial Load** | TMDB daily export files + API enrichment | Export provides all IDs quickly; API enrichment fills in details |
| **Incremental Updates** | TMDB Changes API + selective re-fetch | Changes API identifies modified records; re-fetch only those |

**Why hybrid?**
1. **Export files** give us a fast way to discover all TMDB IDs without exhausting API rate limits
2. **Discover endpoint** is limited to 10,000 results (500 pages × 20 per page) which may miss some entries
3. **Changes API** is efficient for daily syncs — returns only IDs that changed
4. Combination ensures completeness without missing any sci-fi content

## Initial Load Process

### Step 1: Download and Parse Export File

```
Script: scripts/sync-initial.ts
```

1. Download the latest movie ID export: `https://files.tmdb.org/p/exports/movie_ids_{MM_DD_YYYY}.json.gz`
2. Download the latest TV series ID export: `https://files.tmdb.org/p/exports/tv_series_ids_{MM_DD_YYYY}.json.gz`
3. Decompress and parse each line (JSONL format)
4. Each line contains: `{"id": 123, "original_title": "...", "popularity": 1.23, "adult": false, "video": false}`
5. Filter out: `adult = true`, `video = true`
6. Collect all movie IDs and TV series IDs

### Step 2: Discover Sci-Fi Content via API

Since the export files don't include genre information, we need to identify which IDs are sci-fi:

**Option A (Selected)**: Use the Discover endpoint to get all sci-fi IDs:
- `GET /discover/movie?with_genres=878&sort_by=popularity.desc&page=1..500`
- `GET /discover/tv?with_genres=10765&sort_by=popularity.desc&page=1..500`
- Paginate through all results to collect IDs
- This caps at 10,000 per media type, but sci-fi movies on TMDB are well under this limit for meaningful entries

**Option B (Fallback)**: For completeness, fetch details for all IDs from the export and check if genre 878/10765 is present. This is much slower but catches everything.

**Decision**: Use Option A as primary. If total_results from discover exceeds 10,000, fall back to Option B for the remainder.

### Step 3: Fetch Full Details

For each discovered sci-fi ID:

1. Call `GET /movie/{id}?append_to_response=credits,keywords` (movies)
2. Call `GET /tv/{id}?append_to_response=credits,keywords` (TV series)
3. `append_to_response` reduces API calls by bundling credits and keywords into a single request
4. Rate limiting: max 35 requests per 10 seconds with exponential backoff on 429 responses
5. Progress tracking: save checkpoint after every 100 records to `sync-state.json`

### Step 4: Load into Database

For each fetched record:

1. **Transaction per record** — ensures atomicity:
   - Upsert into `movies` / `tv_series`
   - Upsert into `genres` (from the genre list in the response)
   - Upsert into `people` (from credits.cast and credits.crew)
   - Upsert into `keywords`
   - Upsert into `production_companies`
   - Insert junction records (movie_genres, movie_cast, movie_crew, movie_keywords, movie_production_companies)
2. After all records loaded, rebuild FTS index with denormalized names
3. Update `sync_state` with completion info

### Step 5: Build FTS Index

After all data is loaded, populate denormalized text fields in FTS tables:

```sql
-- For each movie, aggregate cast/crew/keyword names
UPDATE movies_fts SET
  cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_cast mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies_fts.rowid),
  crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_crew mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = movies_fts.rowid),
  keyword_names = (SELECT GROUP_CONCAT(k.name, ', ') FROM movie_keywords mk JOIN keywords k ON mk.keyword_id = k.id WHERE mk.movie_id = movies_fts.rowid);
```

## Incremental Sync Process

### TMDB Changes API

The Changes API returns a list of IDs that have been modified within a date range:
- `GET /movie/changes?start_date=2026-03-29&end_date=2026-03-30`
- `GET /tv/changes?start_date=2026-03-29&end_date=2026-03-30`
- Maximum date range: 14 days
- Returns: `{"results": [{"id": 123, "adult": false}, ...], "page": 1, "total_pages": 3}`

### Tracking Sync Position

The `sync_state` table maintains:

| Field | Purpose |
|---|---|
| `last_sync_date` | The date of the last successful sync run |
| `last_change_date` | The end_date parameter used in the last changes API call |

**Incremental sync logic**:

```
1. Read last_change_date from sync_state
2. Set start_date = last_change_date
3. Set end_date = today's date (UTC)
4. If (end_date - start_date) > 14 days:
     Split into 14-day chunks and process sequentially
5. Call /movie/changes?start_date=X&end_date=Y (paginate all pages)
6. Call /tv/changes?start_date=X&end_date=Y (paginate all pages)
7. Collect all changed IDs
8. For each changed ID:
   a. Fetch full details from TMDB API
   b. Check if genre includes 878 (movie) or 10765 (TV)
   c. If sci-fi: upsert into database (same logic as initial load Step 4)
   d. If not sci-fi but exists in our DB: remove from database (genre may have changed)
9. Rebuild FTS for affected records
10. Update sync_state: last_change_date = end_date, last_sync_date = now
```

### Preventing Missed or Duplicate Data

| Concern | Solution |
|---|---|
| **Missed records** | Use `start_date = last_change_date` (inclusive overlap). TMDB changes API returns IDs changed on that date, so including the boundary date ensures no gap. |
| **Duplicate records** | All database writes use UPSERT (INSERT OR REPLACE on tmdb_id). Processing the same ID twice is idempotent. |
| **Interrupted sync** | Checkpoint after each record. On restart, re-query changes for the full date range — duplicates handled by upsert. |
| **TMDB genre changes** | If a movie/TV series loses the sci-fi genre, the incremental sync detects it (genre 878/10765 not present) and removes it from our database. |
| **New content** | New sci-fi entries appear in the changes API when they're created or when their genre is set. |
| **Date boundary safety** | Store `last_change_date` as the `end_date` of the successfully completed sync. Next sync uses this as `start_date`, creating a 1-day overlap that guarantees no gap. |

### Scheduling

The incremental sync runs daily via `node-cron`:

```
Schedule: 0 9 * * * (9:00 AM UTC — after TMDB exports are available at 8 AM UTC)
```

For Ubuntu deployment, the sync can also be configured as a systemd timer or cron job:

```cron
0 9 * * * cd /path/to/scifionly && node scripts/sync-incremental.js >> /var/log/scifionly-sync.log 2>&1
```

## Error Handling

| Scenario | Handling |
|---|---|
| TMDB API 429 (Rate Limited) | Exponential backoff: 1s, 2s, 4s, 8s, max 60s. Retry up to 5 times. |
| TMDB API 5xx (Server Error) | Retry with backoff. After 3 failures, skip record and log for manual review. |
| Network timeout | 30-second timeout per request. Retry up to 3 times. |
| Invalid/missing data | Log warning, skip record. Don't fail the entire sync. |
| Export file unavailable | Try previous day's export file. If 3 consecutive days fail, alert. |
| Database write failure | Roll back transaction for that record. Log error. Continue with next record. |

## Configuration

```env
# .env
TMDB_API_KEY=your_bearer_token_here
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
DATABASE_PATH=./data/scifionly.db
SYNC_BATCH_SIZE=100
SYNC_RATE_LIMIT_MS=300
LOG_LEVEL=info
```

## Monitoring and Logging

- Structured JSON logging with timestamps
- Log levels: DEBUG, INFO, WARN, ERROR
- Key metrics logged per sync run:
  - Total records processed
  - New records added
  - Records updated
  - Records removed
  - Errors encountered
  - Duration
- Sync history stored in `sync_state` table

## CLI Interface

```bash
# Initial load
npx tsx scripts/sync-initial.ts

# Incremental sync
npx tsx scripts/sync-incremental.ts

# Force full re-sync
npx tsx scripts/sync-initial.ts --force

# Dry run (no database changes)
npx tsx scripts/sync-incremental.ts --dry-run

# Status check
npx tsx scripts/sync-status.ts
```
