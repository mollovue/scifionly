# SciFi Only — Test Harness Specification

## Overview

This document defines the complete test case inventory for the SciFi Only project, covering both the web application (TypeScript/Vitest) and the mobile application (Dart/Flutter Test). Each test case is mapped to specific requirement IDs from the app specs, marked with its current implementation status, and categorized by type and applicability.

### Conventions

- **Status**: `Existing` = test already exists in codebase | `To Be Implemented` = test needs to be written
- **Applies To**: `Shared` = same logic in both apps | `Web` = web app only | `Mobile` = mobile app only
- **Type**: `Unit` = isolated function/class test | `Widget` = UI component test | `Integration` = multi-layer or API test
- **Priority**: `P0` = critical path, must have | `P1` = important, should have | `P2` = nice to have

---

## 1. Search & Filtering

### 1.1 Full-Text Search (FTS5)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-FTS-1 | Search by title returns matching results (e.g., "blade runner") | W-SRCH-2, M-DB-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-FTS-2 | Search by overview text returns results (e.g., "astronaut") | W-SRCH-2, M-DB-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-FTS-3 | Search for TV series by name (e.g., "expanse") | W-SRCH-2, M-DB-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-FTS-4 | Search for nonexistent term returns empty results | W-SRCH-2, M-DB-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-FTS-5 | Search result has correct shape (id, tmdb_id, type, title, vote_average, popularity) | W-SRCH-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-FTS-6 | Search across cast/crew names returns matching content | W-SRCH-2, W-SRCH-8, W-SRCH-9 | Unit | Shared | To Be Implemented | P1 |

### 1.2 Content Type Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-TYPE-1 | type=movie returns only movies | W-SRCH-5, M-SRCH-5 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TYPE-2 | type=tv returns only TV series | W-SRCH-5, M-SRCH-5 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TYPE-3 | No type filter (or type=both) returns movies and TV series | W-SRCH-5, M-SRCH-5 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TYPE-4 | type=movie combined with text query returns only matching movies | W-SRCH-5, W-SRCH-20 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TYPE-5 | Invalid type value falls back to returning all content | W-SRCH-5 | Integration | Web | Existing | P1 |

### 1.3 Year Range Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-YEAR-1 | year_min filters out content before that year | W-SRCH-10, M-SRCH-6 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-YEAR-2 | year_max filters out content after that year | W-SRCH-10, M-SRCH-6 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-YEAR-3 | year_min + year_max combined returns content within range (inclusive) | W-SRCH-10, M-SRCH-6 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-YEAR-4 | Year filter ignores content with null/missing release dates | W-SRCH-10 | Unit | Shared | To Be Implemented | P1 |

### 1.4 Rating Range Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-RATE-1 | rating_min returns only content with vote_average >= threshold | W-SRCH-13, M-SRCH-7 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-RATE-2 | rating_max returns only content with vote_average <= threshold | W-SRCH-13, M-SRCH-7 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-RATE-3 | Very high rating_min (e.g., 9.5) returns very few or no results | W-SRCH-13 | Integration | Web | Existing | P1 |

### 1.5 Minimum Votes Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-VOTES-1 | min_votes filters out content with vote_count below threshold | W-SRCH-14, M-SRCH-8 | Unit | Shared | To Be Implemented | P0 |
| S-VOTES-2 | min_votes=0 or unset returns all content regardless of vote count | W-SRCH-14, M-SRCH-8 | Unit | Shared | To Be Implemented | P1 |

### 1.6 Status Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-STAT-1 | Filter by status "Released" returns only released content | W-SRCH-11, M-SRCH-9 | Unit | Shared | To Be Implemented | P0 |
| S-STAT-2 | Filter by status "Returning Series" returns only returning TV series | W-SRCH-11, M-SRCH-9 | Unit | Shared | To Be Implemented | P1 |
| S-STAT-3 | No status filter returns all content regardless of status | W-SRCH-11, M-SRCH-9 | Unit | Shared | To Be Implemented | P1 |

### 1.7 Language Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-LANG-1 | Filter by original_language returns only content in that language | W-SRCH-12, M-SRCH-10 | Unit | Shared | To Be Implemented | P0 |
| S-LANG-2 | No language filter returns all content | W-SRCH-12, M-SRCH-10 | Unit | Shared | To Be Implemented | P1 |

### 1.8 Keyword Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-KW-1 | Filter by keyword ID returns only content with that keyword | W-SRCH-16 | Unit | Shared | To Be Implemented | P0 |
| S-KW-2 | No keyword filter returns all content | W-SRCH-16 | Unit | Shared | To Be Implemented | P1 |

### 1.9 Cast/Crew Filter

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-CAST-1 | Filter by cast_id returns only content featuring that person | W-SRCH-8 | Unit | Shared | To Be Implemented | P0 |
| S-CREW-1 | Filter by crew_id returns only content with that crew member | W-SRCH-9 | Unit | Shared | To Be Implemented | P0 |

### 1.10 Sort Options

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-SORT-1 | sort_by=popularity returns results sorted by popularity descending | W-SRCH-15, M-SRCH-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-SORT-2 | sort_by=vote_average returns results sorted by rating descending | W-SRCH-15, M-SRCH-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-SORT-3 | sort_by=title ASC returns alphabetical order | W-SRCH-15, M-SRCH-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-SORT-4 | sort_by=release_date returns results sorted by date | W-SRCH-15, M-SRCH-11 | Unit | Shared | To Be Implemented | P1 |
| S-SORT-5 | Sort order toggle (asc/desc) reverses result ordering | W-SRCH-15, M-SRCH-12 | Unit | Shared | To Be Implemented | P1 |

### 1.11 Title-Only and Description-Only Search (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-TITLE-1 | Title-only search returns results matching title field only | W-SRCH-6 | Unit | Web | To Be Implemented | P1 |
| W-DESC-1 | Description-only search returns results matching overview field only | W-SRCH-7 | Unit | Web | To Be Implemented | P1 |

### 1.12 Combined Filters (AND Logic)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-AND-1 | year + rating combined filter applies both conditions | W-SRCH-20, M-SRCH-5 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AND-2 | type + year + rating combined filter applies all conditions | W-SRCH-20 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AND-3 | Combined filters via API with query string | W-API-1, W-SRCH-20 | Integration | Web | Existing | P0 |

### 1.13 Pagination

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-PAGE-1 | Default page returns correct page metadata (page, per_page, total, total_pages) | W-RES-6, M-SRCH-17 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-PAGE-2 | Page 2 returns different results than page 1 | W-RES-6, M-SRCH-17 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-PAGE-3 | 20 results per page by default | W-RES-6, M-SRCH-17 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-PAGE-4 | Very large page number returns empty results gracefully | W-RES-6 | Integration | Web | Existing | P1 |
| S-PAGE-5 | per_page=0 handled gracefully | W-RES-6 | Integration | Web | Existing | P1 |

---

## 2. Movie Detail

### 2.1 Movie Data Retrieval

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-MOV-1 | getMovieById returns movie with full details (id, title, overview, etc.) | W-API-2, W-MOV-3, M-MOV-3 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-2 | Movie includes genres array with id and name | W-MOV-7, M-MOV-7 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-3 | Movie includes cast array with name, character, person_id | W-MOV-10, M-MOV-10 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-4 | Movie includes crew array with name, job | W-MOV-11, M-MOV-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-5 | Movie includes keywords array | W-MOV-12, M-MOV-12 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-6 | Movie includes production_companies array | W-MOV-12, M-MOV-12 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-MOV-7 | getMovieById returns null/undefined for non-existent ID | W-API-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |

### 2.2 Movie Detail API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-MOV-API-1 | GET /api/movies/:id returns 200 with full movie details | W-API-2 | Integration | Web | Existing | P0 |
| W-MOV-API-2 | GET /api/movies/:id returns 404 for nonexistent ID | W-API-2 | Integration | Web | Existing | P0 |
| W-MOV-API-3 | GET /api/movies/:id returns 400 for non-numeric ID | W-API-2 | Integration | Web | Existing | P1 |

### 2.3 Movie Detail UI

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-MOV-UI-1 | Backdrop image displayed with gradient overlay | W-MOV-1, M-MOV-1 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-2 | Poster image displayed | W-MOV-2, M-MOV-2 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-3 | Title and original title displayed (original title shown if different) | W-MOV-3, M-MOV-3 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-4 | Release date, runtime, and status displayed | W-MOV-4, M-MOV-4 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-5 | Rating badge displayed with correct color coding | W-MOV-5, M-MOV-5 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-6 | Tagline displayed in italic (hidden if null/empty) | W-MOV-6, M-MOV-6 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-7 | Genre badges displayed as chips | W-MOV-7, M-MOV-7 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-8 | TMDB and IMDB action buttons/links present | W-MOV-8, M-MOV-8 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-9 | Overview text displayed | W-MOV-9, M-MOV-9 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-10 | Top Cast section displays cast cards (max 15) in horizontal row | W-MOV-10, M-MOV-10 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-11 | Crew section shows Directors, Writers, Producers | W-MOV-11, M-MOV-11 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-12 | Details panel shows language, budget, revenue, companies, keywords, spoken languages | W-MOV-12, M-MOV-12 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-13 | Budget/revenue hidden when 0 or null | W-MOV-12, M-MOV-12 | Widget | Shared | To Be Implemented | P1 |
| S-MOV-UI-14 | TMDB attribution displayed at bottom | W-ATTR-3, M-MOV-13 | Widget | Shared | To Be Implemented | P2 |
| M-MOV-UI-15 | TTS button plays/stops overview text | M-MOV-9 | Widget | Mobile | To Be Implemented | P2 |
| M-MOV-UI-16 | Share button shares title + TMDB link | M-MOV-8 | Widget | Mobile | To Be Implemented | P2 |
| W-MOV-UI-17 | Recommendations section displays similar titles | W-MOV-13 | Widget | Web | To Be Implemented | P2 |

---

## 3. TV Series Detail

### 3.1 TV Data Retrieval

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-TV-1 | getTvSeriesById returns TV series with full details | W-API-7, M-TV-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TV-2 | TV series includes genres array | W-TV-1, M-TV-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TV-3 | TV series includes cast array | W-TV-1, M-TV-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TV-4 | TV series includes crew array | W-TV-1, M-TV-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TV-5 | TV series includes seasons/episodes count | W-TV-3, M-TV-4 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-TV-6 | getTvSeriesById returns null/undefined for non-existent ID | W-API-7 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |

### 3.2 TV Detail API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-TV-API-1 | GET /api/tv/:id returns 200 with full details | W-API-7 | Integration | Web | Existing | P0 |
| W-TV-API-2 | GET /api/tv/:id returns 404 for nonexistent ID | W-API-7 | Integration | Web | Existing | P0 |
| W-TV-API-3 | GET /api/tv/:id returns 400 for non-numeric ID | W-API-7 | Integration | Web | Existing | P1 |

### 3.3 TV Detail UI

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-TV-UI-1 | First Air Date / Last Air Date displayed | W-TV-2, M-TV-2 | Widget | Shared | To Be Implemented | P1 |
| S-TV-UI-2 | Number of Seasons and Episodes displayed | W-TV-3, M-TV-3 | Widget | Shared | To Be Implemented | P1 |
| S-TV-UI-3 | Episode Runtime displayed | W-TV-4, M-TV-5 | Widget | Shared | To Be Implemented | P1 |
| S-TV-UI-4 | Networks displayed | W-TV-5, M-TV-4 | Widget | Shared | To Be Implemented | P1 |
| S-TV-UI-5 | Status displayed (Returning, Ended, Canceled) | W-TV-6, M-TV-3 | Widget | Shared | To Be Implemented | P1 |
| M-TV-UI-6 | Series Info card shows seasons, episodes, air dates, networks | M-TV-4 | Widget | Mobile | To Be Implemented | P1 |
| M-TV-UI-7 | No IMDB button for TV series | M-TV-7 | Widget | Mobile | To Be Implemented | P1 |
| M-TV-UI-8 | "Creators" shown instead of "Directors" in crew section | M-TV-6 | Widget | Mobile | To Be Implemented | P1 |
| S-TV-UI-9 | No Budget/Revenue fields in TV details panel | W-TV-1, M-TV-5 | Widget | Shared | To Be Implemented | P1 |

---

## 4. Person Detail

### 4.1 Person Data Retrieval

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-PER-1 | getPersonById returns person with profile data (name, known_for_department, profile_path) | W-PER-1, W-PER-2, M-PER-1, M-PER-2 | Unit | Shared | To Be Implemented | P0 |
| S-PER-2 | Person includes movie filmography (credits as actor/crew) | W-PER-3, M-PER-3 | Unit | Shared | To Be Implemented | P0 |
| S-PER-3 | Person includes TV series filmography | W-PER-3, M-PER-3 | Unit | Shared | To Be Implemented | P0 |
| S-PER-4 | Filmography entries include title, role, year, rating | W-PER-3, M-PER-4 | Unit | Shared | To Be Implemented | P0 |
| S-PER-5 | Filmography sorted by date descending | W-PER-3, M-PER-5 | Unit | Shared | To Be Implemented | P0 |
| S-PER-6 | getPersonById returns null for non-existent ID | W-PER-1 | Unit | Shared | To Be Implemented | P0 |

### 4.2 Person Detail API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-PER-API-1 | GET /api/people/:id returns 200 with person details | W-PER-1 | Integration | Web | To Be Implemented | P0 |
| W-PER-API-2 | GET /api/people/:id returns 404 for nonexistent ID | W-PER-1 | Integration | Web | To Be Implemented | P0 |

### 4.3 Person Detail UI

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-PER-UI-1 | Profile photo displayed (or placeholder if null) | W-PER-1, M-PER-1 | Widget | Shared | To Be Implemented | P1 |
| S-PER-UI-2 | Name and known-for department displayed | W-PER-2, M-PER-2 | Widget | Shared | To Be Implemented | P1 |
| S-PER-UI-3 | Filmography grouped by role (Actor, Director, etc.) | W-PER-3, M-PER-3 | Widget | Shared | To Be Implemented | P1 |
| S-PER-UI-4 | Each filmography entry links/navigates to detail screen | W-PER-4, M-PER-6 | Widget | Shared | To Be Implemented | P1 |
| S-PER-UI-5 | Empty state shown when person has no filmography | W-PER-3, M-PER-7 | Widget | Shared | To Be Implemented | P1 |

---

## 5. Browse Page

### 5.1 Browse Data Queries

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-BRW-1 | getTrending movies returns results sorted by popularity descending | W-BRW-1, W-API-3, M-BRW-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-BRW-2 | getTrending TV series returns results sorted by popularity descending | W-BRW-1, W-API-8, M-BRW-5 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-BRW-3 | getTopRated movies returns results sorted by vote_average descending | W-BRW-2, W-API-4, M-BRW-3 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-BRW-4 | getTopRated TV series returns results sorted by vote_average descending | W-BRW-2, W-API-9, M-BRW-6 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-BRW-5 | Top-rated results have high ratings (>= 7.0) | W-BRW-2 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P1 |
| S-BRW-6 | getTrending/getTopRated respect limit parameter | W-BRW-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P1 |
| S-BRW-7 | getRecent movies returns recently released movies (last 3 months) | W-BRW-3, W-API-5, M-BRW-4 | Unit | Shared | To Be Implemented | P0 |
| S-BRW-8 | getRecent TV returns recently aired TV (last 3 months) | M-BRW-7 | Unit | Shared | To Be Implemented | P0 |

### 5.2 Browse API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-BRW-API-1 | GET /api/movies/trending returns 200 with movies sorted by popularity | W-API-3 | Integration | Web | Existing | P0 |
| W-BRW-API-2 | GET /api/movies/top-rated returns 200 with movies sorted by rating | W-API-4 | Integration | Web | Existing | P0 |
| W-BRW-API-3 | GET /api/movies/recent returns 200 with recently released movies | W-API-5 | Integration | Web | To Be Implemented | P0 |
| W-BRW-API-4 | GET /api/movies/upcoming returns upcoming movies | W-API-6 | Integration | Web | To Be Implemented | P1 |
| W-BRW-API-5 | GET /api/tv/trending returns 200 with TV sorted by popularity | W-API-8 | Integration | Web | To Be Implemented | P0 |
| W-BRW-API-6 | GET /api/tv/top-rated returns 200 with TV sorted by rating | W-API-9 | Integration | Web | To Be Implemented | P0 |
| W-BRW-API-7 | Trending endpoint supports limit parameter | W-API-3 | Integration | Web | Existing | P1 |

### 5.3 Browse UI

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-BRW-UI-1 | Browse page displays category sections in vertical list | W-BRW-6, M-BRW-1 | Widget | Shared | To Be Implemented | P1 |
| S-BRW-UI-2 | Each section has a header with "See All" link/button | W-BRW-6, M-BRW-8 | Widget | Shared | To Be Implemented | P1 |
| S-BRW-UI-3 | Content rows scroll horizontally | W-BRW-6, M-BRW-9 | Widget | Shared | To Be Implemented | P1 |
| S-BRW-UI-4 | Each row displays up to 20 items | M-BRW-9 | Widget | Mobile | To Be Implemented | P2 |
| M-BRW-UI-5 | Pull-to-refresh reloads all categories | M-BRW-10 | Widget | Mobile | To Be Implemented | P1 |
| W-BRW-UI-6 | Upcoming section displays (web only) | W-BRW-4 | Widget | Web | To Be Implemented | P2 |
| W-BRW-UI-7 | Classic Sci-Fi section displays pre-2000 content (web only) | W-BRW-5 | Widget | Web | To Be Implemented | P2 |

---

## 6. Autocomplete

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-AC-1 | autocompletePeople returns matching people for partial name (e.g., "Chris") | W-API-10, W-SRCH-8 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AC-2 | autocompletePeople returns matches for last name (e.g., "Nolan") | W-API-10 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AC-3 | autocompletePeople result has id, name, profile_path, known_for_department | W-API-10 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AC-4 | autocompletePeople respects limit parameter | W-API-10 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P1 |
| S-AC-5 | autocompletePeople returns empty for empty query | W-API-10 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P1 |
| S-AC-6 | autocompleteKeywords returns matching keywords (e.g., "space") | W-API-11, W-SRCH-16 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AC-7 | autocompleteKeywords result has id and name | W-API-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-AC-8 | autocompleteKeywords respects limit parameter | W-API-11 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P1 |

### Autocomplete API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-AC-API-1 | GET /api/autocomplete/people?q=chris returns matching people | W-API-10 | Integration | Web | Existing | P0 |
| W-AC-API-2 | GET /api/autocomplete/people with missing q returns empty results | W-API-10 | Integration | Web | Existing | P1 |
| W-AC-API-3 | GET /api/autocomplete/keywords?q=space returns matching keywords | W-API-11 | Integration | Web | Existing | P0 |
| W-AC-API-4 | GET /api/autocomplete/keywords results have id and name | W-API-11 | Integration | Web | Existing | P0 |

---

## 7. Stats

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-STATS-1 | getStats returns total_movies, total_tv_series, genres_count, people_count | W-API-12, M-SRCH-1 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-STATS-2 | total_movies is a positive integer | W-API-12 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-STATS-3 | total_tv_series is a positive integer | W-API-12 | Unit | Shared | Existing (Web) / To Be Implemented (Mobile) | P0 |
| S-STATS-4 | genres_count >= 5 | W-API-12 | Unit | Web | Existing | P1 |

### Stats API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-STATS-API-1 | GET /api/stats returns 200 with stats object | W-API-12 | Integration | Web | Existing | P0 |

---

## 8. Search API (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-SRCH-API-1 | GET /api/search returns 200 with valid response structure (results, total, page, per_page, total_pages) | W-API-1 | Integration | Web | Existing | P0 |
| W-SRCH-API-2 | GET /api/search?query=blade returns Blade Runner results | W-API-1, W-SRCH-2 | Integration | Web | Existing | P0 |
| W-SRCH-API-3 | GET /api/search?query=expanse finds The Expanse | W-API-1 | Integration | Web | Existing | P0 |
| W-SRCH-API-4 | GET /api/search?query=gibberish returns empty | W-API-1 | Integration | Web | Existing | P0 |
| W-SRCH-API-5 | GET /api/search?type=movie returns only movies | W-API-1, W-SRCH-5 | Integration | Web | Existing | P0 |
| W-SRCH-API-6 | GET /api/search?type=tv returns only TV series | W-API-1, W-SRCH-5 | Integration | Web | Existing | P0 |
| W-SRCH-API-7 | GET /api/search with year_min/year_max filters | W-API-1, W-SRCH-10 | Integration | Web | Existing | P0 |
| W-SRCH-API-8 | GET /api/search with rating_min filter | W-API-1, W-SRCH-13 | Integration | Web | Existing | P0 |
| W-SRCH-API-9 | GET /api/search with multiple combined filters (AND logic) | W-API-1, W-SRCH-20 | Integration | Web | Existing | P0 |
| W-SRCH-API-10 | GET /api/search supports pagination | W-API-1, W-RES-6 | Integration | Web | Existing | P0 |
| W-SRCH-API-11 | GET /api/search with sort_by=vote_average | W-API-1, W-SRCH-15 | Integration | Web | Existing | P0 |

---

## 9. Image Caching (Web)

### 9.1 Image Cache Storage

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-IMG-S-1 | getCachedImage returns null for uncached poster | W-IMG-2 | Unit | Web | Existing | P0 |
| W-IMG-S-2 | getCachedImage returns null for uncached backdrop | W-IMG-2 | Unit | Web | Existing | P0 |
| W-IMG-S-3 | getCachedImage returns null for non-existent media ID | W-IMG-2 | Unit | Web | Existing | P0 |
| W-IMG-S-4 | getCachedImage returns null for uncached TV poster | W-IMG-2 | Unit | Web | Existing | P0 |
| W-IMG-S-5 | cacheImage + getCachedImage round-trip for poster (data + content-type preserved) | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-S-6 | cacheImage + getCachedImage round-trip for backdrop (webp) | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-S-7 | cacheImage + getCachedImage round-trip for TV poster (png) | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-S-8 | cacheImage + getCachedImage round-trip for TV backdrop | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-S-9 | Different sizes stored separately (w342 vs w500) | W-IMG-6 | Unit | Web | Existing | P0 |
| W-IMG-S-10 | Different media types stored separately (movie vs tv for same ID) | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-S-11 | Upsert overwrites existing cache entry (INSERT OR REPLACE) | W-IMG-5 | Unit | Web | Existing | P1 |
| W-IMG-S-12 | getTmdbImagePath returns poster_path for movie | W-IMG-4 | Unit | Web | Existing | P0 |
| W-IMG-S-13 | getTmdbImagePath returns backdrop_path for movie | W-IMG-4 | Unit | Web | Existing | P0 |
| W-IMG-S-14 | getTmdbImagePath returns null for non-existent movie | W-IMG-4 | Unit | Web | Existing | P0 |
| W-IMG-S-15 | getTmdbImagePath returns null for non-existent TV series | W-IMG-4 | Unit | Web | Existing | P0 |

### 9.2 Image Fetcher

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-IMG-F-1 | makeImageKey creates colon-separated key (media:id:type:size) | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-2 | makeImageKey produces different keys for different sizes | W-IMG-6 | Unit | Web | Existing | P0 |
| W-IMG-F-3 | makeImageKey produces different keys for movie vs tv | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-4 | makeImageKey produces different keys for poster vs backdrop | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-5 | fetchTmdbImage 200 OK returns success with data and content-type | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-6 | fetchTmdbImage 404 returns failure without retrying | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-7 | fetchTmdbImage rejects non-image content-type | W-IMG-9 | Unit | Web | Existing | P0 |
| W-IMG-F-8 | fetchTmdbImage rejects oversized image (> 5MB) | W-IMG-7 | Unit | Web | Existing | P0 |
| W-IMG-F-9 | fetchTmdbImage handles timeout (AbortError) | W-IMG-7 | Unit | Web | Existing | P0 |
| W-IMG-F-10 | fetchTmdbImage retries on 5xx server errors | W-IMG-8 | Unit | Web | Existing | P0 |
| W-IMG-F-11 | fetchTmdbImage accepts image/webp content type | W-IMG-9 | Unit | Web | Existing | P1 |
| W-IMG-F-12 | fetchTmdbImage accepts image/png content type | W-IMG-9 | Unit | Web | Existing | P1 |
| W-IMG-F-13 | fetchTmdbImage retries on network errors | W-IMG-8 | Unit | Web | Existing | P0 |
| W-IMG-F-14 | fetchAndCacheImage calls cache callback on success | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-15 | fetchAndCacheImage does not call cache callback on failure | W-IMG-5 | Unit | Web | Existing | P0 |
| W-IMG-F-16 | fetchAndCacheImage clears in-flight status after completion | W-IMG-8 | Unit | Web | Existing | P1 |
| W-IMG-F-17 | fetchAndCacheImage clears in-flight status on error | W-IMG-8 | Unit | Web | Existing | P1 |

### 9.3 Image API

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-IMG-API-1 | Returns 400 for invalid mediaType (e.g., "anime") | W-IMG-1 | Integration | Web | Existing | P0 |
| W-IMG-API-2 | Returns 400 for invalid imageType (e.g., "logo") | W-IMG-1 | Integration | Web | Existing | P0 |
| W-IMG-API-3 | Returns 400 for non-numeric ID | W-IMG-1 | Integration | Web | Existing | P0 |
| W-IMG-API-4 | Accepts "movie" and "tv" as valid mediaType | W-IMG-1 | Integration | Web | Existing | P0 |
| W-IMG-API-5 | Accepts "poster" and "backdrop" as valid imageType | W-IMG-1 | Integration | Web | Existing | P0 |
| W-IMG-API-6 | Cache hit returns 200 with image data | W-IMG-2 | Integration | Web | Existing | P0 |
| W-IMG-API-7 | Cache hit sets correct Content-Type header (image/jpeg) | W-IMG-2, W-IMG-9 | Integration | Web | Existing | P0 |
| W-IMG-API-8 | Cache hit sets Cache-Control header (public, max-age=86400) | W-IMG-2 | Integration | Web | Existing | P1 |
| W-IMG-API-9 | Cache hit sets Content-Length header | W-IMG-2 | Integration | Web | Existing | P1 |
| W-IMG-API-10 | Cache hit returns correct content-type for webp backdrop | W-IMG-9 | Integration | Web | Existing | P0 |
| W-IMG-API-11 | Cache hit returns correct content-type for TV png poster | W-IMG-9 | Integration | Web | Existing | P0 |
| W-IMG-API-12 | Cache hit accepts custom size query parameter | W-IMG-6 | Integration | Web | Existing | P1 |
| W-IMG-API-13 | Cache miss with existing TMDB path returns 202 (fetching) | W-IMG-3 | Integration | Web | Existing | P0 |
| W-IMG-API-14 | No TMDB image path returns 404 | W-IMG-4 | Integration | Web | Existing | P0 |
| W-IMG-API-15 | Default poster size is w342 | W-IMG-6 | Integration | Web | Existing | P1 |
| W-IMG-API-16 | Default backdrop size is w780 | W-IMG-6 | Integration | Web | Existing | P1 |
| W-IMG-API-17 | Handles very large ID numbers gracefully | W-IMG-1 | Integration | Web | Existing | P1 |
| W-IMG-API-18 | Handles negative ID gracefully | W-IMG-1 | Integration | Web | Existing | P1 |

---

## 10. Model Serialization (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-MDL-1 | Movie.fromMap parses all fields correctly (tmdbId, title, voteAverage, runtime) | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-2 | Movie.year returns null for missing/short release date | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-3 | TvSeries.fromMap parses all fields (name, numberOfSeasons, status) | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-4 | TvSeries.year handles null first_air_date | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-5 | Person.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-6 | Genre.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-7 | CastMember.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-8 | CrewMember.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-9 | Keyword.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-10 | ProductionCompany.fromMap parses correctly | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-11 | SearchResult.fromMovieMap creates movie SearchResult | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-12 | SearchResult.fromTvMap creates tv SearchResult | M-DB-1 | Unit | Mobile | Existing | P0 |
| M-MDL-13 | Credit.year extracts from release date | M-PER-4 | Unit | Mobile | Existing | P0 |

---

## 11. Formatters (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-FMT-1 | formatCurrency formats large numbers (e.g., $200,000,000) | M-MOV-12 | Unit | Mobile | Existing | P0 |
| M-FMT-2 | formatCurrency returns empty for null/zero | M-MOV-12 | Unit | Mobile | Existing | P0 |
| M-FMT-3 | formatRuntime formats hours and minutes (e.g., 2h 16m) | M-MOV-4 | Unit | Mobile | Existing | P0 |
| M-FMT-4 | formatRuntime returns empty for null/zero | M-MOV-4 | Unit | Mobile | Existing | P0 |
| M-FMT-5 | formatYear extracts year from date string | M-COMP-1 | Unit | Mobile | Existing | P0 |
| M-FMT-6 | formatYear returns empty for null/short string | M-COMP-1 | Unit | Mobile | Existing | P0 |
| M-FMT-7 | formatVoteCount formats thousands with k suffix | M-MOV-5 | Unit | Mobile | Existing | P0 |
| M-FMT-8 | tmdbImageUrl constructs correct URL with path and size | M-COMP-5 | Unit | Mobile | Existing | P0 |
| M-FMT-9 | tmdbImageUrl returns empty for null/empty path | M-COMP-5 | Unit | Mobile | Existing | P0 |
| M-FMT-10 | tmdbMovieUrl constructs correct TMDB movie URL | M-MOV-8 | Unit | Mobile | Existing | P0 |
| M-FMT-11 | tmdbTvUrl constructs correct TMDB TV URL | M-TV-1 | Unit | Mobile | Existing | P0 |
| M-FMT-12 | imdbMovieUrl constructs correct IMDB URL | M-MOV-8 | Unit | Mobile | Existing | P0 |
| M-FMT-13 | languageName maps known codes (en, ja, ko) | M-MOV-12 | Unit | Mobile | Existing | P0 |
| M-FMT-14 | languageName returns uppercase for unknown codes | M-MOV-12 | Unit | Mobile | Existing | P0 |
| M-FMT-15 | languageName returns "Unknown" for null | M-MOV-12 | Unit | Mobile | Existing | P0 |

---

## 12. Search State (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SS-1 | Empty SearchFilters has no active filters | M-SRCH-15 | Unit | Mobile | Existing | P0 |
| M-SS-2 | contentType change makes filters active | M-SRCH-5 | Unit | Mobile | Existing | P0 |
| M-SS-3 | yearMin makes filters active | M-SRCH-6 | Unit | Mobile | Existing | P0 |
| M-SS-4 | ratingMin makes filters active | M-SRCH-7 | Unit | Mobile | Existing | P0 |
| M-SS-5 | status makes filters active | M-SRCH-9 | Unit | Mobile | Existing | P0 |
| M-SS-6 | sortBy change makes filters active | M-SRCH-11 | Unit | Mobile | Existing | P0 |
| M-SS-7 | copyWith preserves existing values while updating specified ones | M-SRCH-4 | Unit | Mobile | Existing | P0 |
| M-SS-8 | copyWith can set nullable fields to null | M-SRCH-4 | Unit | Mobile | Existing | P0 |
| M-SS-9 | Initial SearchState has no active search | M-SRCH-20 | Unit | Mobile | Existing | P0 |
| M-SS-10 | Query makes search active | M-SRCH-2 | Unit | Mobile | Existing | P0 |
| M-SS-11 | Filters make search active | M-SRCH-5 | Unit | Mobile | Existing | P0 |

---

## 13. UI Components

### 13.1 ContentCard

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-CC-1 | Standard card displays title | M-COMP-1 | Widget | Mobile | Existing | P0 |
| M-CC-2 | Standard card displays year | M-COMP-1 | Widget | Mobile | Existing | P0 |
| M-CC-3 | Standard card displays type badge (Movie/TV) | M-COMP-1 | Widget | Mobile | Existing | P0 |
| M-CC-4 | Compact card displays title below image | M-COMP-2 | Widget | Mobile | Existing | P0 |
| M-CC-5 | Tap callback is invoked | M-GEST-1 | Widget | Mobile | Existing | P0 |
| M-CC-6 | TV type badge shows "TV" | M-COMP-1 | Widget | Mobile | Existing | P0 |
| W-CC-1 | Web content card displays title, year, rating, type badge | W-RES-2, M-COMP-1 | Widget | Web | To Be Implemented | P1 |
| W-CC-2 | Web content card hover shows scale + glow + overview excerpt | W-RES-4 | Widget | Web | To Be Implemented | P2 |

### 13.2 CastCard

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-CASTC-1 | Displays name | M-COMP-3 | Widget | Mobile | Existing | P0 |
| M-CASTC-2 | Displays character name | M-COMP-3 | Widget | Mobile | Existing | P0 |
| M-CASTC-3 | Tap callback is invoked | M-GEST-2 | Widget | Mobile | Existing | P0 |

### 13.3 RatingBadge

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-RB-1 | Displays rating text | M-COMP-4 | Widget | Mobile | Existing | P0 |
| M-RB-2 | Shows nothing for null rating | M-COMP-4 | Widget | Mobile | Existing | P0 |
| M-RB-3 | Green color for rating >= 7.0 | M-COMP-4 | Widget | Mobile | Existing | P0 |
| M-RB-4 | Amber color for rating >= 5.0 (and < 7.0) | M-COMP-4 | Widget | Mobile | Existing | P0 |
| M-RB-5 | Red color for rating < 5.0 | M-COMP-4 | Widget | Mobile | Existing | P0 |
| M-RB-6 | Has semantics label "Rating X out of 10" | M-A11Y-3 | Widget | Mobile | Existing | P0 |

### 13.4 TmdbImage

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-IMG-1 | Shows placeholder icon when path is null | W-IMG-10, M-COMP-5 | Widget | Shared | To Be Implemented | P1 |
| S-IMG-2 | Shows shimmer loading state while image loads | W-IMG-10, M-COMP-5 | Widget | Shared | To Be Implemented | P1 |
| S-IMG-3 | Shows placeholder on network failure | W-IMG-10, M-COMP-5 | Widget | Shared | To Be Implemented | P1 |
| M-IMG-4 | Falls back to image_cache table on network failure (mobile) | M-COMP-5 | Widget | Mobile | To Be Implemented | P2 |
| W-IMG-5 | Web TmdbImage uses cache API fallback chain (cache API -> TMDB CDN -> placeholder) | W-IMG-10 | Widget | Web | To Be Implemented | P1 |

### 13.5 BrowseRow (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-BR-1 | Displays items in horizontal scrollable row | M-BRW-9 | Widget | Mobile | To Be Implemented | P1 |
| M-BR-2 | Each item is compact ContentCard (140dp width) | M-BRW-9 | Widget | Mobile | To Be Implemented | P2 |

---

## 14. Theme & Styling

### 14.1 Theme Colors

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-THM-1 | Dark theme SciFiColors match spec hex values | M-THEME-1, M-THEME-2 | Widget | Mobile | Existing | P0 |
| M-THM-2 | Light theme SciFiColors match spec hex values | M-THEME-1, M-THEME-3 | Widget | Mobile | Existing | P0 |
| M-THM-3 | Dark theme uses Material 3 | M-THEME-5 | Widget | Mobile | Existing | P0 |
| M-THM-4 | Dark theme brightness is dark | M-THEME-1 | Widget | Mobile | Existing | P0 |
| M-THM-5 | Light theme brightness is light | M-THEME-3 | Widget | Mobile | Existing | P0 |
| M-THM-6 | SciFiColors copyWith preserves unchanged values | M-THEME-1 | Unit | Mobile | Existing | P1 |
| M-THM-7 | SciFiColors lerp interpolates between dark and light | M-THEME-1 | Unit | Mobile | Existing | P1 |
| M-THM-8 | Exo 2 font family applied via google_fonts | M-THEME-4 | Unit | Mobile | To Be Implemented | P2 |
| W-THM-1 | Web dark mode matches spec color palette | W-THEME-1 | Widget | Web | To Be Implemented | P1 |
| W-THM-2 | Web light mode matches spec color palette | W-THEME-2 | Widget | Web | To Be Implemented | P1 |

### 14.2 Theme Toggle

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| S-THM-TOG-1 | Theme toggle switches between dark and light mode | W-THEME-3, M-SET-6 | Widget | Shared | To Be Implemented | P1 |
| S-THM-TOG-2 | Dark mode is the default | W-THEME-1, M-SET-6 | Widget | Shared | To Be Implemented | P1 |

---

## 15. Navigation

### 15.1 Mobile Navigation

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-NAV-1 | Bottom navigation bar displays Search, Browse, Settings tabs | M-NAV-1 | Widget | Mobile | Existing | P0 |
| M-NAV-2 | Search tab is selected by default | M-NAV-1 | Widget | Mobile | Existing | P0 |
| M-NAV-3 | Tapping Browse navigates to Browse screen | M-NAV-1 | Widget | Mobile | Existing | P0 |
| M-NAV-4 | Tapping Settings navigates to Settings screen | M-NAV-1 | Widget | Mobile | Existing | P0 |
| M-NAV-5 | Can navigate between all tabs (integration) | M-NAV-1 | Integration | Mobile | Existing | P0 |
| M-NAV-6 | Active tab uses Primary Cyan color | M-NAV-2 | Widget | Mobile | To Be Implemented | P2 |
| M-NAV-7 | Back gestures navigate within tab stack before switching | M-NAV-5 | Integration | Mobile | To Be Implemented | P1 |
| M-NAV-8 | Deep route /movie/:id pushes onto tab stack | M-NAV-4 | Integration | Mobile | To Be Implemented | P1 |
| M-NAV-9 | Deep route /tv/:id pushes onto tab stack | M-NAV-4 | Integration | Mobile | To Be Implemented | P1 |
| M-NAV-10 | Deep route /person/:id pushes onto tab stack | M-NAV-4 | Integration | Mobile | To Be Implemented | P1 |

### 15.2 Web Navigation

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-NAV-1 | Hash-based routing navigates to /#/ (home) | W-NAV-1 | Integration | Web | To Be Implemented | P0 |
| W-NAV-2 | Hash-based routing navigates to /#/movie/:id | W-NAV-1 | Integration | Web | To Be Implemented | P0 |
| W-NAV-3 | Hash-based routing navigates to /#/tv/:id | W-NAV-1 | Integration | Web | To Be Implemented | P0 |
| W-NAV-4 | Hash-based routing navigates to /#/person/:id | W-NAV-1 | Integration | Web | To Be Implemented | P0 |
| W-NAV-5 | Hash-based routing navigates to /#/browse | W-NAV-1 | Integration | Web | To Be Implemented | P0 |
| W-NAV-6 | Fixed top navigation bar displays logo, search toggle, browse link, theme toggle | W-NAV-2 | Widget | Web | To Be Implemented | P1 |
| W-NAV-7 | Mobile hamburger menu displays navigation links | W-NAV-3 | Widget | Web | To Be Implemented | P1 |
| W-NAV-8 | Unmatched route shows 404 / Not Found page | W-NAV-4 | Integration | Web | To Be Implemented | P1 |

---

## 16. Settings (Mobile)

### 16.1 Settings Screen

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SET-1 | Shows section headers (Database, TMDB Sync, Appearance, About) | M-SET-1, M-SET-6, M-SET-7 | Widget | Mobile | Existing | P0 |
| M-SET-2 | Shows dark mode toggle | M-SET-6 | Widget | Mobile | Existing | P0 |
| M-SET-3 | Shows TMDB attribution text | M-SET-7 | Widget | Mobile | Existing | P0 |
| M-SET-4 | Shows "Import Database" button | M-SET-1 | Widget | Mobile | Existing | P0 |
| M-SET-5 | Shows "Load Demo Data" button when no database loaded | M-SET-5 | Widget | Mobile | Existing | P0 |
| M-SET-6 | Shows version info | M-SET-7 | Widget | Mobile | Existing | P0 |

### 16.2 Database Import Flow

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-IMPORT-1 | Import via file_picker opens file selector for .db/.sqlite | M-SET-2 | Integration | Mobile | To Be Implemented | P1 |
| M-IMPORT-2 | Import validates database (checks expected tables) | M-SET-3 | Unit | Mobile | To Be Implemented | P0 |
| M-IMPORT-3 | Successful import shows success snackbar and navigates to Search | M-SET-4 | Integration | Mobile | To Be Implemented | P1 |
| M-IMPORT-4 | Failed import shows error dialog, keeps previous database | M-SET-4 | Integration | Mobile | To Be Implemented | P1 |
| M-IMPORT-5 | Demo database creation creates valid database with sample data | M-SET-5, M-DB-5 | Unit | Mobile | To Be Implemented | P0 |

### 16.3 TMDB Sync Settings

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SYNC-SET-1 | API token field displayed with obscured text | M-SYNC-1 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-2 | Visibility toggle toggles token obscuration | M-SYNC-1 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-3 | "Validate & Save" button displayed | M-SYNC-1 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-4 | "Enable Daily Sync" toggle displayed | M-SYNC-2 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-5 | "Enable Daily Sync" switch disabled when no token | M-SYNC-2 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-6 | "Sync Now" button displayed | M-SYNC-3 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-7 | "How to get your API token" expansion tile displayed and expandable | M-SYNC-13 | Widget | Mobile | Existing | P0 |
| M-SYNC-SET-8 | Shows "Never synced" when no sync has occurred | M-SYNC-4 | Widget | Mobile | Existing | P0 |

---

## 17. Sync Engine (Mobile)

### 17.1 Static Helpers

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SE-1 | daysBetween returns 0 for same date | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-2 | daysBetween returns correct days for different dates | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-3 | addDays adds positive/negative days correctly | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-4 | addDays crosses month boundary correctly | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-5 | splitDateRange returns single chunk for range <= maxDays | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-6 | splitDateRange splits into correct chunks for large ranges | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-7 | splitDateRange handles exact maxDays range | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-8 | splitDateRange returns empty for same start/end | M-SYNC-9 | Unit | Mobile | Existing | P0 |
| M-SE-9 | todayUtc returns YYYY-MM-DD format | M-SYNC-5 | Unit | Mobile | Existing | P0 |
| M-SE-10 | Genre filtering: movie sci-fi genre is 878 | M-SYNC-6 | Unit | Mobile | Existing | P0 |
| M-SE-11 | Genre filtering: TV sci-fi genre is 10765 | M-SYNC-6 | Unit | Mobile | Existing | P0 |
| M-SE-12 | Genre filtering: empty genres is not sci-fi | M-SYNC-6 | Unit | Mobile | Existing | P0 |

### 17.2 Sync State

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SSTATE-1 | SyncProgress default values are zero | M-SYNC-4 | Unit | Mobile | Existing | P0 |
| M-SSTATE-2 | SyncProgress copyWith updates specific fields | M-SYNC-4 | Unit | Mobile | Existing | P0 |
| M-SSTATE-3 | SyncProgress summary formats correctly | M-SYNC-4 | Unit | Mobile | Existing | P0 |
| M-SSTATE-4 | SyncStateData fromMap/toMap round-trip | M-SYNC-5 | Unit | Mobile | Existing | P0 |
| M-SSTATE-5 | SyncStateData handles null values | M-SYNC-5 | Unit | Mobile | Existing | P0 |
| M-SSTATE-6 | SyncUiState defaults (idle, no error) | M-SYNC-4 | Unit | Mobile | Existing | P0 |
| M-SSTATE-7 | SyncUiState copyWith updates status and error | M-SYNC-4 | Unit | Mobile | Existing | P0 |

### 17.3 TMDB Client

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-TC-1 | buildUrl constructs correct base URL | M-SYNC-5 | Unit | Mobile | Existing | P0 |
| M-TC-2 | buildUrl includes query parameters | M-SYNC-5 | Unit | Mobile | Existing | P0 |
| M-TC-3 | calculateBackoff returns correct exponential values (1s, 2s, 4s) | M-SYNC-8 | Unit | Mobile | Existing | P0 |
| M-TC-4 | calculateBackoff caps at 60 seconds | M-SYNC-8 | Unit | Mobile | Existing | P0 |
| M-TC-5 | TmdbApiException toString formats correctly | M-SYNC-8 | Unit | Mobile | Existing | P0 |

### 17.4 Sync Flow (End-to-End)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SYNC-E2E-1 | Token validation via TMDB API (mock HTTP) | M-SYNC-1 | Integration | Mobile | To Be Implemented | P0 |
| M-SYNC-E2E-2 | Incremental sync fetches changes and upserts records | M-SYNC-5, M-SYNC-10 | Integration | Mobile | To Be Implemented | P0 |
| M-SYNC-E2E-3 | Rate limiting delays requests appropriately (350ms) | M-SYNC-7 | Integration | Mobile | To Be Implemented | P1 |
| M-SYNC-E2E-4 | Exponential backoff on HTTP errors | M-SYNC-8 | Integration | Mobile | To Be Implemented | P1 |
| M-SYNC-E2E-5 | FTS rebuild for affected rows after sync | M-SYNC-11 | Integration | Mobile | To Be Implemented | P1 |
| M-SYNC-E2E-6 | Sync state persisted (last_change_date updated) | M-SYNC-5 | Integration | Mobile | To Be Implemented | P0 |
| M-SYNC-E2E-7 | Auto-sync on startup/resume when enabled | M-SYNC-12 | Integration | Mobile | To Be Implemented | P1 |
| M-SYNC-E2E-8 | Concurrent sync prevention (no duplicate syncs) | M-SYNC-5 | Integration | Mobile | To Be Implemented | P1 |

---

## 18. Web Sync / Integration (CLI Scripts)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-SYNC-1 | TMDB client constructs correct API URLs | W-SYNC-1 | Unit | Web | To Be Implemented | P1 |
| W-SYNC-2 | Sci-fi genre filtering (878 for movies, 10765 for TV) | W-SYNC-2 | Unit | Web | To Be Implemented | P0 |
| W-SYNC-3 | Incremental sync via Changes API fetches modified records | W-SYNC-3 | Integration | Web | To Be Implemented | P1 |
| W-SYNC-4 | Rate limiting (35 req/10s) with exponential backoff on 429 | W-SYNC-4 | Unit | Web | To Be Implemented | P1 |
| W-SYNC-5 | FTS5 index rebuild after sync | W-SYNC-5 | Integration | Web | To Be Implemented | P1 |
| W-SYNC-6 | sync_state tracking (last_change_date persisted) | W-SYNC-6 | Unit | Web | To Be Implemented | P1 |
| W-SYNC-7 | CLI commands for sync operations (initial, incremental) execute successfully | W-SYNC-7 | Integration | Web | To Be Implemented | P2 |

---

## 19. Database Layer (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-DB-SCHEMA-1 | DatabaseHelper creates schema with expected tables | M-DB-1 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-DEMO-1 | createDemoDatabase produces valid database with ~10 movies and ~5 TV shows | M-DB-5 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-SEARCH-1 | ContentRepository.search returns matching results for text query | M-DB-2 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-SEARCH-2 | ContentRepository.search filters by content type | M-SRCH-5 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-SEARCH-3 | ContentRepository.search filters by year range | M-SRCH-6 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-SEARCH-4 | ContentRepository.search filters by rating range | M-SRCH-7 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-SEARCH-5 | ContentRepository.search paginates results (20 per page) | M-SRCH-17 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-TREND-1 | ContentRepository.getTrending returns movies sorted by popularity | M-BRW-2 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-TREND-2 | ContentRepository.getTrending returns TV sorted by popularity | M-BRW-5 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-TOP-1 | ContentRepository.getTopRated returns movies with min vote threshold | M-BRW-3 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-TOP-2 | ContentRepository.getTopRated returns TV with min vote threshold | M-BRW-6 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-REC-1 | ContentRepository.getRecent returns movies from last 3 months | M-BRW-4 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-MOV-1 | ContentRepository.getMovieById returns full movie with genres, cast, crew, keywords | M-MOV-3 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-TV-1 | ContentRepository.getTvSeriesById returns full TV with genres, cast, crew | M-TV-1 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-PER-1 | ContentRepository.getPersonById returns person with filmography | M-PER-1 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-STATS-1 | ContentRepository.getStats returns movie and TV counts | M-SRCH-1 | Unit | Mobile | To Be Implemented | P0 |
| M-DB-AC-1 | ContentRepository.autocompletePeople returns matching people | M-SRCH-2 | Unit | Mobile | To Be Implemented | P1 |
| M-DB-OFFLINE-1 | App works fully offline once database is imported (no remote API calls for content) | M-DB-3 | Integration | Mobile | To Be Implemented | P1 |
| M-DB-OFFLINE-2 | TMDB images require network; placeholder icons shown when offline | M-DB-4 | Widget | Mobile | To Be Implemented | P2 |

---

## 20. Search UI

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SUI-1 | Search screen shows hero section with title and stats | M-SRCH-1 | Widget | Mobile | To Be Implemented | P1 |
| M-SUI-2 | Search bar accepts text input | M-SRCH-2 | Widget | Mobile | Existing (basic) | P0 |
| M-SUI-3 | Search debounces input (300ms delay) | M-SRCH-3, W-SRCH-3 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-4 | Advanced filters section expands inline | M-SRCH-4, W-SRCH-4 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-5 | Active filter chips displayed with delete icon | M-SRCH-15, W-SRCH-17 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-6 | "Clear all" chip removes all filters | M-SRCH-15, W-SRCH-18 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-7 | Results grid displays with correct column count (2 phone, 3 tablet) | M-SRCH-16 | Widget | Mobile | To Be Implemented | P1 |
| M-SUI-8 | Total results count displayed above grid | M-SRCH-18, W-RES-7 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-9 | "Load More" button triggers pagination | M-SRCH-17, W-RES-5 | Widget | Shared | To Be Implemented | P1 |
| M-SUI-10 | Scroll-to-top FAB appears after scrolling | M-SRCH-19, W-RES-8 | Widget | Shared | To Be Implemented | P2 |
| M-SUI-11 | Trending section shown when search is empty | M-SRCH-20 | Widget | Mobile | To Be Implemented | P1 |
| M-SUI-12 | "Apply Filters" button triggers search with current filter values | M-SRCH-13 | Widget | Mobile | To Be Implemented | P1 |
| M-SUI-13 | "Reset Filters" button clears all filter fields | M-SRCH-14 | Widget | Mobile | To Be Implemented | P1 |
| W-SUI-1 | Full-width quick search bar displayed at top of home page | W-SRCH-1 | Widget | Web | To Be Implemented | P1 |
| W-SUI-2 | Filter state preserved in URL hash parameters | W-SRCH-19 | Integration | Web | To Be Implemented | P1 |
| W-SUI-3 | Responsive grid: 5 cols desktop, 3 tablet, 2 mobile | W-RES-1 | Widget | Web | To Be Implemented | P1 |
| W-SUI-4 | Lazy loading + skeleton placeholder for images | W-RES-3, W-PERF-3 | Widget | Web | To Be Implemented | P1 |

---

## 21. Empty / Error States

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-ERR-1 | No results state: illustration + "No results found" message | M-ERR-1 | Widget | Mobile | To Be Implemented | P1 |
| M-ERR-2 | No database state: message + link to Settings | M-ERR-2, M-LOAD-6 | Widget | Mobile | Existing (basic) | P0 |
| M-ERR-3 | Error state: "Something went wrong" + Retry button | M-ERR-3 | Widget | Mobile | To Be Implemented | P1 |
| M-ERR-4 | Detail not found: "Content not found" + back button | M-LOAD-8 | Widget | Mobile | To Be Implemented | P1 |
| M-ERR-5 | Query error: inline error banner above results | M-LOAD-7 | Widget | Mobile | To Be Implemented | P1 |

---

## 22. Loading States

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-LOAD-1 | Screen-level loading shows CircularProgressIndicator | M-LOAD-1 | Widget | Mobile | To Be Implemented | P2 |
| M-LOAD-2 | Shimmer skeleton placeholders shown for list/grid loading | M-LOAD-2 | Widget | Mobile | To Be Implemented | P2 |
| M-LOAD-3 | Shimmer rectangle shown for image loading | M-LOAD-3 | Widget | Mobile | To Be Implemented | P2 |
| M-LOAD-4 | RefreshIndicator on Browse screen | M-LOAD-4 | Widget | Mobile | To Be Implemented | P2 |
| M-LOAD-5 | Pagination loading indicator at bottom of results | M-LOAD-5 | Widget | Mobile | To Be Implemented | P2 |
| M-LOAD-6 | Network error for images shows placeholder icon silently | M-LOAD-9 | Widget | Mobile | To Be Implemented | P2 |

---

## 23. Accessibility (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-A11Y-TC-1 | All images have semantic labels (contentDescription) | M-A11Y-1 | Widget | Mobile | To Be Implemented | P1 |
| M-A11Y-TC-2 | Interactive elements have minimum 48dp touch targets | M-A11Y-2 | Widget | Mobile | To Be Implemented | P1 |
| M-A11Y-TC-3 | Rating badges have semantics label | M-A11Y-3 | Widget | Mobile | Existing | P0 |
| M-A11Y-TC-4 | Screen reader support via Semantics widgets on custom components | M-A11Y-4 | Widget | Mobile | To Be Implemented | P1 |
| M-A11Y-TC-5 | Sufficient color contrast ratios for both themes | M-A11Y-5 | Unit | Mobile | To Be Implemented | P2 |
| M-A11Y-TC-6 | Focus traversal follows visual layout order | M-A11Y-6 | Widget | Mobile | To Be Implemented | P2 |
| M-A11Y-TC-7 | Text scales with system font size settings | M-A11Y-7 | Widget | Mobile | To Be Implemented | P2 |

---

## 24. Gestures & Touch (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-GEST-1 | Tap ContentCard navigates to detail screen | M-GEST-1 | Widget | Mobile | Existing (callback) | P0 |
| M-GEST-2 | Tap CastCard navigates to person detail | M-GEST-2 | Widget | Mobile | Existing (callback) | P0 |
| M-GEST-3 | Tap crew member navigates to person detail | M-GEST-3 | Widget | Mobile | To Be Implemented | P1 |
| M-GEST-4 | Tap filter chip X removes that filter | M-GEST-4 | Widget | Mobile | To Be Implemented | P1 |
| M-GEST-5 | Swipe back on detail screens pops navigation | M-GEST-6 | Integration | Mobile | To Be Implemented | P1 |
| M-GEST-6 | Pull down on Browse refreshes categories | M-GEST-7 | Widget | Mobile | To Be Implemented | P1 |
| M-GEST-7 | Horizontal scroll on browse rows pans through items | M-GEST-8 | Widget | Mobile | To Be Implemented | P2 |

---

## 25. Keyboard Behavior (Mobile)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-KB-1 | Scrolling results dismisses keyboard | M-KB-1 | Widget | Mobile | To Be Implemented | P2 |
| M-KB-2 | Tapping outside search field dismisses keyboard | M-KB-2 | Widget | Mobile | To Be Implemented | P2 |
| M-KB-3 | Submitting search dismisses keyboard and triggers search | M-KB-3 | Widget | Mobile | To Be Implemented | P2 |

---

## 26. TMDB Attribution

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-ATTR-1 | TMDB logo displayed in footer (web) | W-ATTR-1 | Widget | Web | To Be Implemented | P2 |
| W-ATTR-2 | Attribution text displayed (web) | W-ATTR-2 | Widget | Web | To Be Implemented | P2 |
| W-ATTR-3 | Link to TMDB for each movie/TV series (web) | W-ATTR-3 | Widget | Web | To Be Implemented | P2 |
| M-ATTR-1 | TMDB attribution text in Settings about section | M-SET-7, M-SET-8 | Widget | Mobile | Existing | P0 |

---

## 27. Performance (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-PERF-TC-1 | First Contentful Paint < 1.5s | W-PERF-1 | Integration | Web | To Be Implemented | P2 |
| W-PERF-TC-2 | Search response time < 200ms for FTS queries | W-PERF-2 | Integration | Web | To Be Implemented | P1 |
| W-PERF-TC-3 | Skeleton loading states render during async operations | W-PERF-4 | Widget | Web | To Be Implemented | P2 |
| W-PERF-TC-4 | TanStack Query caching with 5 min stale time configured | W-PERF-5 | Unit | Web | To Be Implemented | P2 |

---

## 28. Responsive Design (Web)

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| W-RESP-1 | Mobile breakpoint (< 640px): single column layout | W-THEME-4 | Widget | Web | To Be Implemented | P2 |
| W-RESP-2 | Tablet breakpoint (640-1024px): 2-3 column grid | W-THEME-4 | Widget | Web | To Be Implemented | P2 |
| W-RESP-3 | Desktop breakpoint (> 1024px): 4-5 column grid, expanded filters | W-THEME-4 | Widget | Web | To Be Implemented | P2 |

---

## 29. Smoke Tests

| ID | Test Case | Req IDs | Type | Applies To | Status | Priority |
|----|-----------|---------|------|------------|--------|----------|
| M-SMOKE-1 | App starts and shows "SciFi Only" title | M-NAV-1 | Widget | Mobile | Existing | P0 |
| M-SMOKE-2 | Search screen shows "No database loaded" initially | M-ERR-2 | Integration | Mobile | Existing | P0 |

---

## Summary Statistics

### Test Case Counts by Status

| Status | Count |
|--------|-------|
| Existing (fully implemented) | 192 |
| Existing (Web) / To Be Implemented (Mobile) | 52 |
| Existing (basic/callback only) | 4 |
| To Be Implemented | 175 |
| **Total** | **423** |

### Test Case Counts by Type

| Type | Count |
|------|-------|
| Unit | 200 |
| Widget | 138 |
| Integration | 85 |
| **Total** | **423** |

### Test Case Counts by Applies To

| Applies To | Count |
|------------|-------|
| Shared | 115 |
| Web | 126 |
| Mobile | 182 |
| **Total** | **423** |

### Test Case Counts by Priority

| Priority | Count |
|----------|-------|
| P0 (Critical) | 262 |
| P1 (Important) | 127 |
| P2 (Nice to have) | 34 |
| **Total** | **423** |

### Coverage by Area

| Area | Existing | To Be Implemented | Total |
|------|----------|-------------------|-------|
| Search & Filtering (1.1-1.13) | 29 | 23 | 52 |
| Movie Detail (2) | 10 | 14 | 24 |
| TV Detail (3) | 6 | 12 | 18 |
| Person Detail (4) | 0 | 11 | 11 |
| Browse (5) | 8 | 11 | 19 |
| Autocomplete (6) | 10 | 2 | 12 |
| Stats (7) | 5 | 0 | 5 |
| Search API — Web (8) | 11 | 0 | 11 |
| Image Caching — Web (9) | 50 | 0 | 50 |
| Models — Mobile (10) | 13 | 0 | 13 |
| Formatters — Mobile (11) | 15 | 0 | 15 |
| Search State — Mobile (12) | 11 | 0 | 11 |
| UI Components (13) | 12 | 9 | 21 |
| Theme & Styling (14) | 9 | 5 | 14 |
| Navigation (15) | 5 | 13 | 18 |
| Settings — Mobile (16) | 14 | 5 | 19 |
| Sync Engine — Mobile (17) | 17 | 8 | 25 |
| Web Sync (18) | 0 | 7 | 7 |
| Database Layer — Mobile (19) | 0 | 19 | 19 |
| Search UI (20) | 1 | 16 | 17 |
| Error States (21) | 1 | 4 | 5 |
| Loading States (22) | 0 | 6 | 6 |
| Accessibility (23) | 1 | 6 | 7 |
| Gestures & Touch (24) | 2 | 5 | 7 |
| Keyboard (25) | 0 | 3 | 3 |
| Attribution (26) | 1 | 3 | 4 |
| Performance — Web (27) | 0 | 4 | 4 |
| Responsive — Web (28) | 0 | 3 | 3 |
| Smoke Tests (29) | 2 | 0 | 2 |

### Existing Test File Mapping

| Test File | Test Cases | Status |
|-----------|------------|--------|
| **Web: tests/setup.ts** | Test infrastructure (DB seeding) | Setup file |
| **Web: tests/unit/storage.test.ts** | S-FTS-*, S-TYPE-*, S-YEAR-*, S-RATE-*, S-SORT-*, S-AND-*, S-PAGE-*, S-MOV-*, S-TV-*, S-BRW-*, S-AC-*, S-STATS-* | 35 tests |
| **Web: tests/unit/image-cache-storage.test.ts** | W-IMG-S-* | 15 tests |
| **Web: tests/unit/image-fetcher.test.ts** | W-IMG-F-* | 17 tests |
| **Web: tests/integration/api.test.ts** | W-SRCH-API-*, W-MOV-API-*, W-TV-API-*, W-BRW-API-*, W-AC-API-*, W-STATS-API-* | 40+ tests |
| **Web: tests/integration/image-api.test.ts** | W-IMG-API-* | 18 tests |
| **Mobile: test/unit/formatters_test.dart** | M-FMT-* | 15 tests |
| **Mobile: test/unit/models_test.dart** | M-MDL-* | 13 tests |
| **Mobile: test/unit/search_state_test.dart** | M-SS-* | 11 tests |
| **Mobile: test/unit/sync_engine_test.dart** | M-SE-* | 12 tests |
| **Mobile: test/unit/sync_state_test.dart** | M-SSTATE-* | 7 tests |
| **Mobile: test/unit/tmdb_client_test.dart** | M-TC-* | 5 tests |
| **Mobile: test/widget/content_card_test.dart** | M-CC-* | 6 tests |
| **Mobile: test/widget/cast_card_test.dart** | M-CASTC-* | 3 tests |
| **Mobile: test/widget/rating_badge_test.dart** | M-RB-* | 6 tests |
| **Mobile: test/widget/settings_screen_test.dart** | M-SET-* | 6 tests |
| **Mobile: test/widget/settings_sync_section_test.dart** | M-SYNC-SET-* | 8 tests |
| **Mobile: test/widget/shell_screen_test.dart** | M-NAV-1 to M-NAV-4 | 4 tests |
| **Mobile: test/widget/theme_test.dart** | M-THM-* | 7 tests |
| **Mobile: test/widget_test.dart** | M-SMOKE-1 | 1 test |
| **Mobile: test/integration/navigation_test.dart** | M-NAV-5, M-SUI-2, M-SMOKE-2 | 3 tests |
