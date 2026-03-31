# SciFi Only — Self-Review: Gaps and Resolutions

## Review Date: 2026-03-30

### Critical Issues Found and Resolved

#### 1. FTS5 Content-Sync Triggers Won't Have Junction Data
**Issue**: The FTS5 triggers fire on INSERT/UPDATE to the movies table, but at that point junction tables (movie_cast, movie_crew, movie_keywords) haven't been populated yet. The denormalized fields (cast_names, crew_names, keyword_names) will be empty.

**Resolution**: Remove auto-triggers. Instead, use a manual FTS rebuild step after all junction data is loaded. The sync scripts will:
1. Insert/update the main record
2. Insert all junction records
3. Rebuild FTS for that specific record using a dedicated function
4. This applies to both initial and incremental sync

#### 2. TV Series Genre ID Clarification
**Issue**: The spec uses genre ID 10765 for sci-fi TV, but TMDB has two relevant TV genres:
- 10765 = "Sci-Fi & Fantasy" (combined genre for TV)
- There is no pure "Science Fiction" (878) for TV like there is for movies

**Resolution**: Use genre 10765 for TV series discovery. Document that TV series are filtered by "Sci-Fi & Fantasy" which is TMDB's categorization. The keyword filter can further refine to exclude pure fantasy titles if desired. Add note to the webapp spec that the Browse page could have a "TV: Sci-Fi & Fantasy" label.

#### 3. Discover Endpoint Pagination Limit
**Issue**: TMDB discover endpoint returns max 500 pages (10,000 results). The spec mentions this but the fallback strategy isn't fully defined.

**Resolution**: For the initial implementation, 10,000 sci-fi movies and 10,000 sci-fi TV series is more than sufficient. TMDB has approximately 15,000-20,000 movies tagged as sci-fi, but the vast majority with any meaningful data (votes, popularity) fall within the 10,000 limit. The discover endpoint can be sorted by different criteria (popularity, release date, rating) to capture different slices. For completeness, the initial load can run multiple discover queries with different sort orders and merge the ID sets.

#### 4. Image URL Construction Not Documented
**Issue**: TMDB returns partial image paths (e.g., `/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg`). The full URL requires a base URL and size specification.

**Resolution**: Add to webapp spec: TMDB image URL format is `https://image.tmdb.org/t/p/{size}/{path}`. Common sizes:
- `w92`, `w154`, `w185`, `w342`, `w500`, `w780` (posters)
- `w300`, `w780`, `w1280`, `original` (backdrops)
- `w45`, `w185`, `h632` (profiles)
Frontend helper utility will construct full URLs with appropriate sizes for each context (grid thumbnail vs. detail page).

#### 5. Search API Response Format Not Specified
**Issue**: The webapp spec lists the `/api/search` endpoint but doesn't define the response schema.

**Resolution**: Add response schema:
```json
{
  "results": [
    {
      "id": 123,
      "tmdb_id": 27205,
      "type": "movie",
      "title": "Inception",
      "overview": "...",
      "poster_path": "/path.jpg",
      "release_date": "2010-07-15",
      "vote_average": 8.4,
      "vote_count": 36565,
      "popularity": 116.0,
      "genres": ["Science Fiction", "Action"],
      "original_language": "en"
    }
  ],
  "total": 1523,
  "page": 1,
  "per_page": 20,
  "total_pages": 77
}
```

#### 6. Person Search in Cast/Crew Filters
**Issue**: The advanced filter combobox for cast/director uses person names, but the database search needs person IDs for junction table queries.

**Resolution**: The autocomplete endpoint (`/api/autocomplete/people`) returns `{id, name, known_for_department}`. When a user selects a person, the frontend sends the person's internal ID (not TMDB ID) as the filter parameter. The backend joins through the junction tables.

#### 7. No Rate Limit on Our Own API
**Issue**: The search API has no rate limiting, which could be abused.

**Resolution**: Add a basic rate limiter to Express using `express-rate-limit`. Default: 100 requests per minute per IP. This is sufficient for the use case and prevents abuse.

#### 8. Missing: Database Migrations Strategy
**Issue**: No strategy for schema changes after initial deployment.

**Resolution**: Use Drizzle Kit migrations. Schema changes in `shared/schema.ts` generate SQL migration files via `drizzle-kit generate`. Migrations are applied via `drizzle-kit migrate`. Migration files are committed to the repo.

### Minor Issues Found and Resolved

#### 9. Spoken Languages Storage
**Issue**: `spoken_languages` is stored as a JSON text column, but the spec doesn't define the JSON structure.

**Resolution**: Store as JSON array of objects: `[{"iso_639_1": "en", "english_name": "English"}]`. Parse on read.

#### 10. TV Series `episode_run_time` Is Deprecated
**Issue**: TMDB has deprecated the `episode_run_time` field on TV series.

**Resolution**: Still store it if available for historical data, but don't rely on it in the UI. Display it only if non-empty.

#### 11. No Explicit Content-Type Headers
**Issue**: The API spec doesn't mention Content-Type headers.

**Resolution**: Express response middleware automatically sets `Content-Type: application/json`. No action needed, but document in API responses section.

### Consistency Checks

| Check | Status | Notes |
|---|---|---|
| All schema columns referenced in API responses exist | ✅ | Verified |
| Junction table PKs allow proper data modeling | ✅ | movie_cast uses (movie_id, person_id, character) to handle multiple roles |
| FTS columns align with search filters | ✅ | All searchable text fields are in FTS |
| API endpoints match frontend page requirements | ✅ | Every page's data needs are served by an endpoint |
| Sync state covers all failure modes | ✅ | Checkpoint + idempotent upserts + date overlap |
| Image paths are consistently handled | ✅ After fix | Added image URL construction to webapp spec |
| Tech stack versions are compatible | ✅ | All versions verified |

### Approved for Development

All critical issues have been addressed. The specifications are consistent and complete for implementation. Proceed to development phase.
