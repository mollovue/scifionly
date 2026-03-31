# 08 — Incremental TMDB Sync Specification (Mobile App)

This document specifies the incremental TMDB sync feature for the SciFi Only Flutter mobile app. The sync engine replicates the web app's `sync-incremental.ts` logic, adapted for Dart/sqflite.

---

## 1. TMDB API Authentication

TMDB's v3 API supports two authentication methods, both providing identical access:

1. **API Key** — passed as query parameter `?api_key=xxx`
2. **API Read Access Token** (Bearer token) — passed as `Authorization: Bearer {token}` header

**This app uses the Read Access Token (Bearer token) approach**, consistent with the web app's `tmdb-client.ts`. Both credentials are obtained from the same TMDB account settings page, but only the Read Access Token is needed.

The token is sent on every request as:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### How Users Obtain Their Token

1. Go to https://www.themoviedb.org/ and create a free account (or log in)
2. Navigate to Profile → Settings → API (sidebar)
3. Under "Request an API Key", click "click here"
4. Select "Developer" and accept the terms of use
5. Fill in application details (any name/URL works — e.g., "SciFi Only" and "http://localhost")
6. After submission, the page displays both the API Key and the **API Read Access Token**
7. Copy the "API Read Access Token" (the long string under that heading)

Direct link: https://www.themoviedb.org/settings/api

---

## 2. Settings Screen: TMDB Sync Section

A new "TMDB Sync" section is added to the Settings screen between the existing "Database" and "Appearance" sections.

### 2.1 API Token Field

- `TextField` for the user's TMDB API Read Access Token
- Obscured text (like a password field) with a visibility toggle icon button
- **"Validate" button** that makes a test API call (`GET /authentication`) to verify the token
  - On success: show green checkmark icon and "Token valid" text
  - On failure: show red error icon and error message
- Token stored persistently using `SharedPreferences` (key: `tmdb_api_token`)
- **"Clear" button** to remove the stored token (only shown when a token is saved)

### 2.2 Sync Control

- `SwitchListTile` labeled **"Enable Daily Sync"**
- Disabled (greyed out) until a valid token is saved
- When enabled for the **first time**: immediately triggers an incremental sync
- When left enabled: sync runs once per day, but **only on days the app is opened/used** (not a background service)
- When disabled: no automatic syncing occurs
- Below the switch: "Last synced: March 30, 2026" or "Never synced"
- Enabled state stored in `SharedPreferences` (key: `sync_enabled`)

### 2.3 Manual Sync Button

- `OutlinedButton` labeled **"Sync Now"**
- Only enabled when: a valid token is saved AND a database is loaded AND no sync is currently in progress
- Triggers an immediate incremental sync regardless of schedule
- While sync is in progress: button is disabled and shows "Syncing..."

### 2.4 Sync Status Indicator

- While syncing: `LinearProgressIndicator` with status text below it
  - Status messages cycle through: "Fetching changes...", "Processing movies...", "Processing TV series...", "Updating database..."
- After sync completes: summary text — e.g., "Synced: 5 added, 12 updated, 0 removed"
- On error: red error text with the failure reason

### 2.5 How-to Instructions

- Expandable `ExpansionTile` labeled **"How to get your API token"**
- Contains the step-by-step instructions from Section 1 above
- Includes a tappable link to https://www.themoviedb.org/settings/api

---

## 3. Incremental Sync Engine — Detailed Operation

### 3.1 Prerequisites

- A valid TMDB Read Access Token must be configured in settings
- A database must be loaded (either imported or demo)
- The database must be opened in **read-write mode** (changed from current read-only)

### 3.2 Sync Algorithm

1. **Read sync state**: Query `last_change_date` from `sync_state` table (id = 1)
   - If null or no row exists (first sync on this database): use **14 days ago** as start date
2. **Compute date range**: `start_date = last_change_date`, `end_date = today (UTC)`
3. **Check if up-to-date**: If `start_date >= end_date`, sync is not needed — return early
4. **Split large ranges**: If range > 14 days, split into 14-day chunks (TMDB Changes API maximum window)
5. **For each date chunk**:
   a. Fetch all changed movie IDs via `GET /movie/changes?start_date=X&end_date=Y` (paginate through all pages)
   b. Fetch all changed TV IDs via `GET /tv/changes?start_date=X&end_date=Y` (paginate through all pages)
   c. **For each changed movie ID**:
      - Fetch details: `GET /movie/{id}?append_to_response=credits,keywords`
      - If genres include **878** (Science Fiction): upsert movie with all related data
      - If genres do NOT include 878 AND movie exists in local DB: delete it (genre changed)
      - On 404: skip silently (deleted from TMDB)
   d. **For each changed TV ID**:
      - Fetch details: `GET /tv/{id}?append_to_response=credits,keywords`
      - If genres include **10765** (Sci-Fi & Fantasy): upsert TV series with all related data
      - If genres do NOT include 10765 AND TV series exists in local DB: delete it
      - On 404: skip silently
6. **Update sync_state**: Set `last_sync_date = today`, `last_sync_type = 'incremental'`, `last_change_date = end_date`, update `total_movies` and `total_tv_series` counts
7. **Rebuild FTS index** for affected rows (delete + re-insert FTS entries)
8. **Report summary**: `{added, updated, removed, errors}`

### 3.3 Rate Limiting

- Minimum **350ms** between consecutive TMDB API calls (~2.8 req/sec, with safety margin)
- On **429** response: read `Retry-After` header; if missing, use exponential backoff (1s, 2s, 4s…)
- On **5xx** response: retry up to 3 times with exponential backoff (1s, 2s, 4s…, max 60s)
- On **network error**: retry up to 3 times with exponential backoff
- Request timeout: 30 seconds per request

### 3.4 Upsert Logic (per movie)

All operations within a single database transaction:

1. **Upsert movie row** — `INSERT OR REPLACE` on `tmdb_id` UNIQUE conflict
   - Fields: tmdb_id, title, original_title, overview, poster_path, backdrop_path, release_date, status, runtime, vote_average, vote_count, popularity, budget, revenue, original_language, spoken_languages (JSON), tagline, homepage, imdb_id, tmdb_updated_at
2. **Get internal movie ID** — `SELECT id FROM movies WHERE tmdb_id = ?`
3. **Upsert genres** — `INSERT OR REPLACE INTO genres` for each genre
4. **Re-link movie_genres** — DELETE existing → INSERT new entries
5. **Upsert production companies** — `INSERT OR REPLACE INTO production_companies`
6. **Re-link movie_production_companies** — DELETE existing → INSERT new
7. **Upsert keywords** — `INSERT OR REPLACE INTO keywords`
8. **Re-link movie_keywords** — DELETE existing → INSERT new
9. **Upsert cast** (top 20) — Upsert people, DELETE existing movie_cast, INSERT new
   - Filter to top 20 by `order` field
10. **Upsert crew** (relevant jobs only) — Upsert people, DELETE existing movie_crew, INSERT new
    - Relevant jobs: Director, Writer, Screenplay, Producer, Executive Producer
11. **Update denormalized columns** — SET `cast_names`, `crew_names`, `keyword_names` via subqueries
12. **Update FTS** — DELETE from movies_fts WHERE rowid = id, then INSERT new FTS entry

### 3.5 Upsert Logic (per TV series)

All operations within a single database transaction:

1. **Upsert TV row** — `INSERT OR REPLACE` on `tmdb_id` UNIQUE conflict
   - Fields: tmdb_id, name, original_name, overview, poster_path, backdrop_path, first_air_date, last_air_date, status, number_of_seasons, number_of_episodes, episode_run_time (JSON), vote_average, vote_count, popularity, original_language, spoken_languages (JSON), tagline, homepage, networks (JSON), tmdb_updated_at
2. **Get internal TV ID** — `SELECT id FROM tv_series WHERE tmdb_id = ?`
3. **Upsert genres** → re-link `tv_series_genres`
4. **Upsert cast** (top 20) → re-link `tv_series_cast`
5. **Upsert crew** (relevant jobs: Director, Creator, Showrunner, Executive Producer) → re-link `tv_series_crew`
6. **Update denormalized columns** — `cast_names`, `crew_names`
7. **Update FTS** — DELETE + INSERT in `tv_series_fts`

### 3.6 Daily Auto-Sync Logic

- On **app startup** (in `main.dart`), after database and providers are initialized, check if sync is enabled via `SharedPreferences`
- If enabled, compare `last_sync_date` (from sync_state) to today's date
- If not synced today: run incremental sync in background (does not block UI)
- Also check on **app resume** via `WidgetsBindingObserver.didChangeAppLifecycleState`
- Only trigger once per app session even if resumed multiple times

---

## 4. Home Screen Content Update Date

The Search/Home screen hero section currently shows "{N} Movies" and "{N} TV Series" stat chips.

- Add a **"Last updated: Mar 30, 2026"** line below the stats row
- If no sync has ever occurred: show "Never synced"
- This reads from `sync_state.last_sync_date` column
- After a sync completes, this refreshes automatically via provider invalidation
- Formatted using `intl` DateFormat for locale-appropriate display

---

## 5. Database Mode Change

The database must be opened in **read-write mode** for sync writes:

- `DatabaseHelper.openDb()`: change `readOnly: true` → `readOnly: false`
- `DatabaseHelper.importDatabase()`: change validation open and final reopen to `readOnly: false`
- `DatabaseHelper.createDemoDatabase()`: change final reopen to `readOnly: false`
- `_createSchema()`: after creating the sync_state table, ensure a default row exists:
  ```sql
  INSERT OR IGNORE INTO sync_state(id) VALUES (1)
  ```

---

## 6. New Dependencies

Add to `pubspec.yaml`:

- **`shared_preferences: ^2.2.2`** — persist API token and sync-enabled flag
- **`http: ^1.2.1`** — HTTP client for TMDB API calls

---

## 7. New and Modified Files

### New Files

| File | Purpose |
|------|---------|
| `lib/features/sync/tmdb_client.dart` | TMDB API client with rate limiting, retry, and typed responses |
| `lib/features/sync/sync_engine.dart` | Incremental sync orchestrator (date ranges, process chunks, upserts) |
| `lib/features/sync/sync_state.dart` | Sync state model, progress tracking, and result reporting |
| `lib/providers/sync_providers.dart` | Riverpod providers for sync state, token, auto-sync control |

### Modified Files

| File | Changes |
|------|---------|
| `lib/ui/screens/settings_screen.dart` | Add TMDB Sync section with token field, sync controls, status indicator |
| `lib/ui/screens/search_screen.dart` | Show "Last updated" date in hero section |
| `lib/features/database/database_helper.dart` | Open database in read-write mode; ensure sync_state row on demo creation |
| `lib/features/database/content_repository.dart` | Add `getSyncState()` method to read sync state for display |
| `lib/main.dart` | Initialize SharedPreferences; trigger auto-sync on startup |
| `pubspec.yaml` | Add `shared_preferences` and `http` dependencies |

### New Test Files

| File | Purpose |
|------|---------|
| `test/unit/tmdb_client_test.dart` | URL construction, headers, rate limit delay, retry logic |
| `test/unit/sync_engine_test.dart` | Date range splitting, genre filtering, sync state management |
| `test/unit/sync_state_test.dart` | Sync state model serialization, progress tracking |
| `test/widget/settings_sync_section_test.dart` | TMDB Sync UI section rendering and interactions |

---

## 8. Edge Cases and Error Handling

### 8.1 Missing sync_state Row

If the database was imported from an external source and has no `sync_state` row:
- The sync engine checks for the row before starting
- If missing, it inserts a default row with `last_change_date = NULL`
- A NULL `last_change_date` triggers the "first sync" path (use 14 days ago)

### 8.2 Token Becomes Invalid Mid-Sync

- If a 401 response is received during sync, the sync engine:
  - Stops processing immediately
  - Reports the error: "API token is invalid or expired"
  - Does NOT update `last_change_date` (so the next sync retries from the same point)
  - The UI shows the error in the sync status indicator

### 8.3 App Killed During Sync

- Each entity is persisted in its own transaction, so partial progress is safe
- `last_change_date` is only updated at the END of a successful sync
- If killed mid-sync: on next app launch, the sync will retry from the same `last_change_date`
- This may re-process some entities, but the upsert logic makes this idempotent

### 8.4 Database Not Loaded

- Sync controls are disabled in the UI when no database is loaded
- The sync engine checks for a valid database reference before starting
- If the database is closed mid-sync (unlikely but possible), the transaction will fail and the sync stops

### 8.5 Network Connectivity

- The sync engine does not check network status proactively
- Network errors are handled by the retry logic (up to 3 retries with backoff)
- If all retries fail, the sync reports the network error and stops
- The user can manually retry via the "Sync Now" button

### 8.6 Concurrent Sync Prevention

- A `_isSyncing` flag in the sync engine prevents concurrent syncs
- The UI disables "Sync Now" while a sync is in progress
- The auto-sync check also respects this flag

### 8.7 Large Date Ranges

- If a user hasn't synced for months, the range is split into 14-day chunks
- Progress is reported per chunk for UI feedback
- This prevents hitting TMDB API limits and memory pressure from huge response sets

### 8.8 FTS Rebuild Safety

- FTS updates use DELETE + INSERT (not INSERT OR REPLACE, which FTS5 doesn't support)
- Each FTS update is within the same transaction as the entity upsert
- If the transaction fails, both the entity and FTS stay consistent

### 8.9 Thread Safety

- sqflite operations in Flutter are already serialized per database instance
- The sync engine runs asynchronously on the main isolate using `async`/`await`
- No separate isolate is needed because sqflite handles its own threading
- The UI remains responsive because database operations are non-blocking via the `async` API
- The rate limiting delay (350ms per request) naturally yields to the event loop

---

## 9. TMDB API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/authentication` | GET | Validate API token |
| `/movie/changes` | GET | Get changed movie IDs (params: start_date, end_date, page) |
| `/tv/changes` | GET | Get changed TV IDs (params: start_date, end_date, page) |
| `/movie/{id}` | GET | Get movie details (param: append_to_response=credits,keywords) |
| `/tv/{id}` | GET | Get TV details (param: append_to_response=credits,keywords) |

Base URL: `https://api.themoviedb.org/3`

All requests include header: `Authorization: Bearer {token}`
