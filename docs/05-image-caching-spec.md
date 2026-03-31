# SciFi Only — Image Caching Specification

## Overview

Currently, the web app stores TMDB relative image paths (`poster_path`, `backdrop_path`) in the database but relies on the TMDB CDN (`https://image.tmdb.org/t/p/{size}{path}`) at render time. This means images are fetched from TMDB on every page load, resulting in placeholder icons when TMDB paths are missing or the CDN is unreachable.

This specification adds **lazy-load image caching**: when a title is viewed, the app asynchronously downloads the poster thumbnail and backdrop image from TMDB, stores the binary data in SQLite, and serves it locally. On subsequent views, images are served directly from the database — no TMDB dependency at render time.

## Goals

1. **Poster thumbnails**: Download, cache in DB, and serve poster images for movies and TV series
2. **Backdrop images**: Download, cache in DB, and serve backdrop images for movies and TV series
3. **Lazy-load pattern**: Images are fetched on-demand when a user first views a title, not during bulk sync
4. **DB-first serving**: Frontend checks the local API for cached images before falling back to TMDB CDN
5. **Resilience**: If TMDB is unreachable, cached images still render; uncached titles show placeholders gracefully

## TMDB Image API Reference

### Image URL Construction

TMDB images are constructed from three components:

```
{base_url}/{size}/{file_path}
```

- **Base URL**: `https://image.tmdb.org/t/p`
- **Size**: Predefined size identifiers (see below)
- **File path**: Relative path from the TMDB API response (e.g., `/1E5baAaEse26fej7uHcjOgEE2t2.jpg`)

### Available Sizes

| Type | Sizes | Recommended for Caching |
|---|---|---|
| Poster | `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original` | `w342` (card grid), `w500` (detail page) |
| Backdrop | `w300`, `w780`, `w1280`, `original` | `w780` (detail page header) |

### Image Endpoints

No separate API call is needed. The existing `poster_path` and `backdrop_path` fields already stored in the `movies` and `tv_series` tables contain the relative file paths. Images are fetched via direct HTTP GET to the constructed URL.

**Authentication**: TMDB image CDN does **not** require an API key. Image URLs are publicly accessible.

**Rate Limits**: TMDB does not enforce strict rate limits on image downloads from `image.tmdb.org`. However, bulk downloads should be throttled to ~10 requests/second to be respectful.

### Validated Approach

The existing codebase already stores `poster_path` and `backdrop_path` from the TMDB API (see `shared/schema.ts` — `movies.poster_path`, `movies.backdrop_path`, `tvSeries.poster_path`, `tvSeries.backdrop_path`). These relative paths are the keys needed to construct the full image URL. No additional TMDB API calls are needed — just HTTP GETs to the image CDN.

## Database Schema Changes

### New Table: `image_cache`

A single table stores all cached images (posters and backdrops) for both movies and TV series.

```sql
CREATE TABLE image_cache (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  media_type  TEXT    NOT NULL,   -- 'movie' or 'tv'
  media_id    INTEGER NOT NULL,   -- movies.id or tv_series.id (internal PK)
  image_type  TEXT    NOT NULL,   -- 'poster' or 'backdrop'
  size        TEXT    NOT NULL,   -- TMDB size identifier (e.g., 'w342', 'w780')
  tmdb_path   TEXT,               -- Original TMDB relative path (e.g., '/abc123.jpg')
  image_data  BLOB    NOT NULL,   -- Binary image data (JPEG/PNG)
  content_type TEXT   NOT NULL DEFAULT 'image/jpeg',  -- MIME type
  file_size   INTEGER NOT NULL DEFAULT 0,             -- Size in bytes
  fetched_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(media_type, media_id, image_type, size)
);
```

**Design Decisions:**

| Decision | Rationale |
|---|---|
| Store as BLOB in SQLite | Keeps everything in a single file. SQLite handles BLOBs up to 1GB efficiently. Poster thumbnails are typically 15–40 KB (w342). Backdrops at w780 are typically 80–200 KB. |
| Unique constraint on (media_type, media_id, image_type, size) | Prevents duplicate caching. Upsert-safe. |
| Single table for all image types | Simpler than separate poster/backdrop tables. The `image_type` and `size` columns provide flexibility. |
| `media_id` references internal PK (not tmdb_id) | Consistent with existing junction table patterns in the schema. |

### Indexes

```sql
CREATE INDEX idx_image_cache_lookup ON image_cache(media_type, media_id, image_type, size);
```

### Drizzle Schema Addition

Add to `shared/schema.ts`:

```typescript
export const imageCache = sqliteTable("image_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  media_type: text("media_type").notNull(),       // 'movie' | 'tv'
  media_id: integer("media_id").notNull(),         // FK to movies.id or tv_series.id
  image_type: text("image_type").notNull(),        // 'poster' | 'backdrop'
  size: text("size").notNull(),                     // 'w342', 'w780', etc.
  tmdb_path: text("tmdb_path"),                     // Original TMDB relative path
  image_data: blob("image_data", { mode: "buffer" }).notNull(),
  content_type: text("content_type").notNull().default("image/jpeg"),
  file_size: integer("file_size").notNull().default(0),
  fetched_at: text("fetched_at").default("CURRENT_TIMESTAMP"),
}, (t) => ({
  lookup: unique().on(t.media_type, t.media_id, t.image_type, t.size),
}));

export const insertImageCacheSchema = createInsertSchema(imageCache).omit({
  id: true,
  fetched_at: true,
});
export type InsertImageCache = z.infer<typeof insertImageCacheSchema>;
export type ImageCache = typeof imageCache.$inferSelect;
```

## API Endpoints

### New Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/images/:mediaType/:id/poster` | Serve cached poster (or trigger fetch) |
| GET | `/api/images/:mediaType/:id/backdrop` | Serve cached backdrop (or trigger fetch) |

### GET `/api/images/:mediaType/:id/:imageType`

**Parameters:**
- `mediaType`: `movie` or `tv`
- `id`: Internal database ID (same as used in `/api/movies/:id` and `/api/tv/:id`)
- `imageType`: `poster` or `backdrop`

**Query Parameters:**
- `size` (optional): TMDB size identifier. Defaults: `w342` for poster, `w780` for backdrop

**Response:**

- **Cache hit**: Returns the image binary with appropriate `Content-Type` header (e.g., `image/jpeg`), `Cache-Control: public, max-age=86400`, and `200 OK`
- **Cache miss + TMDB path available**: Returns `202 Accepted` with `{"status": "fetching"}`. The server triggers an asynchronous background fetch. The client should poll or retry after a short delay.
- **No TMDB path available**: Returns `404 Not Found` with `{"error": "No image path available"}`
- **Invalid parameters**: Returns `400 Bad Request`

### Async Fetch Flow (Server-Side)

When a cache miss is detected and a TMDB path exists:

```
1. Return 202 to client immediately (non-blocking)
2. In background:
   a. Construct URL: https://image.tmdb.org/t/p/{size}{tmdb_path}
   b. HTTP GET the image with 30s timeout
   c. Validate response: check Content-Type starts with 'image/'
   d. Validate size: reject images > 5 MB
   e. INSERT OR REPLACE into image_cache
   f. Log success/failure
3. On next client request, serve from cache (200)
```

## Storage Layer Changes

### New Methods in `storage.ts`

```typescript
// Check if a cached image exists
getCachedImage(mediaType: 'movie' | 'tv', mediaId: number, imageType: 'poster' | 'backdrop', size: string): Buffer | null

// Store a fetched image in the cache
cacheImage(entry: InsertImageCache): void

// Get the TMDB path for a given media item and image type
getTmdbImagePath(mediaType: 'movie' | 'tv', mediaId: number, imageType: 'poster' | 'backdrop'): string | null
```

### `getCachedImage` Implementation

```sql
SELECT image_data, content_type
FROM image_cache
WHERE media_type = ? AND media_id = ? AND image_type = ? AND size = ?
LIMIT 1;
```

### `getTmdbImagePath` Implementation

```sql
-- For movies:
SELECT poster_path FROM movies WHERE id = ?;
SELECT backdrop_path FROM movies WHERE id = ?;

-- For TV series:
SELECT poster_path FROM tv_series WHERE id = ?;
SELECT backdrop_path FROM tv_series WHERE id = ?;
```

## Frontend Changes

### Updated `TmdbImage` Component

The `TmdbImage` component (in `client/src/components/tmdb-image.tsx`) currently constructs URLs directly to the TMDB CDN. It needs to be updated to:

1. **Primary source**: Use the local API endpoint (`/api/images/:mediaType/:id/:imageType?size=...`)
2. **Fallback**: If the local endpoint returns 202 (fetching) or fails, show a loading skeleton and retry after 2 seconds (up to 3 retries)
3. **Final fallback**: If the local endpoint returns 404 or all retries exhausted, show the placeholder icon (current behavior)

**New props needed:**

```typescript
interface TmdbImageProps {
  path: string | null | undefined;
  size?: ImageSize;
  alt: string;
  className?: string;
  fallbackType?: "poster" | "backdrop" | "profile" | "generic";
  // New props for cached image loading:
  mediaType?: "movie" | "tv";       // Required for cache-aware loading
  mediaId?: number;                  // Required for cache-aware loading
  imageType?: "poster" | "backdrop"; // Required for cache-aware loading
}
```

### Image Loading Strategy

```
1. If mediaType + mediaId + imageType are provided:
   a. Fetch from /api/images/{mediaType}/{mediaId}/{imageType}?size={size}
   b. If 200 → display the image (blob URL)
   c. If 202 → show skeleton, retry after 2s (max 3 retries)
   d. If 404 or error → show placeholder icon
2. If mediaType/mediaId/imageType NOT provided (backward compat):
   a. Use existing TMDB CDN URL behavior (no change)
```

### Components to Update

| Component | File | Change |
|---|---|---|
| `TmdbImage` | `client/src/components/tmdb-image.tsx` | Add cache-aware loading logic |
| `ContentCard` | `client/src/components/content-card.tsx` | Pass `mediaType`, `mediaId`, `imageType="poster"` to `TmdbImage` |
| `CastCard` | `client/src/components/cast-card.tsx` | No change (profile images stay on TMDB CDN) |
| `MovieDetail` | `client/src/pages/movie-detail.tsx` | Pass `mediaType="movie"`, `mediaId`, `imageType` to both poster and backdrop `TmdbImage` |
| `TvDetail` | `client/src/pages/tv-detail.tsx` | Pass `mediaType="tv"`, `mediaId`, `imageType` to both poster and backdrop `TmdbImage` |
| `Browse` | `client/src/pages/browse.tsx` | Pass cache props via `ContentCard` |
| `Home` | `client/src/pages/home.tsx` | Pass cache props via `ContentCard` |

## Background Fetch Service

### Image Fetch Utility

Add a new server-side utility for downloading and caching images:

```typescript
// server/image-fetcher.ts

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT = 30_000; // 30 seconds

interface FetchImageResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

async function fetchTmdbImage(tmdbPath: string, size: string): Promise<FetchImageResult>
```

### Concurrency Control

To prevent thundering herd when multiple users view the same title:
- Maintain an in-memory `Set<string>` of currently-fetching image keys (`${mediaType}:${mediaId}:${imageType}:${size}`)
- If a fetch is already in progress for a key, skip the duplicate request
- Clear the key from the set when the fetch completes (success or failure)

### Error Handling

| Scenario | Handling |
|---|---|
| TMDB CDN returns 404 | Log warning, do not cache. Frontend shows placeholder. |
| TMDB CDN returns 429 (rate limited) | Retry after `Retry-After` header value or 5 seconds. Max 3 retries. |
| TMDB CDN returns 5xx | Retry with exponential backoff (1s, 2s, 4s). Max 3 retries. |
| Network timeout (30s) | Log warning, do not cache. Frontend shows placeholder. |
| Image exceeds 5 MB | Reject and log warning. Do not cache. |
| Invalid Content-Type (not image/*) | Reject and log warning. Do not cache. |
| SQLite write failure | Log error. Next request will re-trigger fetch. |

## Configuration

Add to `.env`:

```env
# Image caching
IMAGE_CACHE_POSTER_SIZE=w342       # Default poster size to cache
IMAGE_CACHE_BACKDROP_SIZE=w780     # Default backdrop size to cache
IMAGE_FETCH_TIMEOUT_MS=30000       # Timeout for TMDB image downloads
IMAGE_MAX_SIZE_BYTES=5242880       # Max image size (5 MB)
```

## Performance Considerations

### Database Size Impact

Estimated storage per title with both poster and backdrop cached:

| Image Type | Size | Typical File Size |
|---|---|---|
| Poster (w342) | 342px wide | 15–40 KB |
| Backdrop (w780) | 780px wide | 80–200 KB |
| **Total per title** | | **~100–240 KB** |

For the full sci-fi catalog (~10,000 titles):
- **Minimum**: ~1 GB (if all cached)
- **Maximum**: ~2.4 GB (if all cached)
- **Realistic**: Much less — only viewed titles are cached (lazy-load)

### SQLite BLOB Performance

- SQLite handles BLOBs efficiently up to ~100 KB without performance degradation
- Larger BLOBs (100 KB–1 MB) are fine with WAL mode enabled (already configured)
- The `PRAGMA mmap_size = 268435456` (256 MB) setting helps with BLOB read performance
- Each image is read as a single row — no joins needed, fast primary key lookup

### Caching Headers

API responses for cached images should include:
- `Cache-Control: public, max-age=86400` (24 hours — browser-side caching)
- `ETag: {hash of image_data}` (for conditional requests)
- `Content-Type: {content_type from DB}`
- `Content-Length: {file_size from DB}`

## Migration Strategy

1. **Schema migration**: Add the `image_cache` table. No existing tables are modified.
2. **No backfill needed**: Images are cached lazily on first view. No bulk migration required.
3. **Backward compatible**: If the new image endpoints fail, the frontend falls back to TMDB CDN (existing behavior).
4. **Rollback**: Drop the `image_cache` table and revert frontend changes. Zero data loss.

## Testing Requirements

### Unit Tests (storage layer)

- `getCachedImage` returns `null` for uncached images
- `cacheImage` stores and retrieves image data correctly
- `getCachedImage` returns cached data after `cacheImage`
- `getTmdbImagePath` returns correct paths for movies and TV series
- `getTmdbImagePath` returns `null` for non-existent IDs
- Unique constraint prevents duplicate entries
- Upsert (INSERT OR REPLACE) updates existing cache entries

### Integration Tests (API layer)

- `GET /api/images/movie/:id/poster` returns 404 when no TMDB path exists
- `GET /api/images/movie/:id/poster` returns 202 on first request (cache miss with valid path)
- `GET /api/images/movie/:id/poster` returns 200 with image data after caching
- `GET /api/images/movie/:id/backdrop` works for movies
- `GET /api/images/tv/:id/poster` works for TV series
- `GET /api/images/tv/:id/backdrop` works for TV series
- Invalid `mediaType` returns 400
- Invalid `id` returns 400
- Invalid `imageType` returns 400
- `?size=w500` parameter overrides default size
- Response includes correct `Content-Type` header
- Response includes `Cache-Control` header
- Concurrent requests for the same image don't trigger duplicate fetches

### Image Fetch Tests (with mocked HTTP)

- Successful image download stores correct binary data
- 404 from TMDB is handled gracefully (no cache entry created)
- 429 from TMDB triggers retry logic
- Timeout is handled gracefully
- Oversized image (> 5 MB) is rejected
- Invalid Content-Type is rejected
- Concurrent fetch deduplication works correctly

## Sequence Diagrams

### First View (Cache Miss)

```
User          Frontend        API Server       SQLite DB       TMDB CDN
 |               |               |               |               |
 |-- view title->|               |               |               |
 |               |--GET /api/images/movie/42/poster-->|          |
 |               |               |--SELECT image_cache-->|       |
 |               |               |<--null (miss)---------|       |
 |               |<--202 {status: "fetching"}-----|               |
 |               |   (show skeleton)              |               |
 |               |               |--async fetch------------------>|
 |               |               |<--image bytes------------------|
 |               |               |--INSERT image_cache-->|       |
 |               |               |               |<--ok--|       |
 |               |--retry GET /api/images/movie/42/poster-->|    |
 |               |               |--SELECT image_cache-->|       |
 |               |               |<--image bytes---------|       |
 |               |<--200 image/jpeg, binary data--|               |
 |<--render image|               |               |               |
```

### Subsequent View (Cache Hit)

```
User          Frontend        API Server       SQLite DB
 |               |               |               |
 |-- view title->|               |               |
 |               |--GET /api/images/movie/42/poster-->|
 |               |               |--SELECT image_cache-->|
 |               |               |<--image bytes---------|
 |               |<--200 image/jpeg, binary data--|
 |<--render image|               |               |
```

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `shared/schema.ts` | Modify | Add `imageCache` table definition |
| `server/storage.ts` | Modify | Add `getCachedImage`, `cacheImage`, `getTmdbImagePath` methods |
| `server/image-fetcher.ts` | Create | Image download utility with retry logic |
| `server/routes.ts` | Modify | Add `/api/images/:mediaType/:id/:imageType` endpoint |
| `client/src/components/tmdb-image.tsx` | Modify | Add cache-aware loading with retry |
| `client/src/components/content-card.tsx` | Modify | Pass cache props to TmdbImage |
| `client/src/pages/movie-detail.tsx` | Modify | Pass cache props to TmdbImage |
| `client/src/pages/tv-detail.tsx` | Modify | Pass cache props to TmdbImage |
| `client/src/pages/browse.tsx` | Modify | Pass cache props via ContentCard |
| `client/src/pages/home.tsx` | Modify | Pass cache props via ContentCard |
| `tests/unit/storage.test.ts` | Modify | Add image cache storage tests |
| `tests/integration/api.test.ts` | Modify | Add image API endpoint tests |
| `tests/unit/image-fetcher.test.ts` | Create | Image fetch utility tests |
