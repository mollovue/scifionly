# SciFi Only — Web Application Specification

## Overview

SciFi Only (scifion.ly) is a modern search-first web application that allows users to conveniently search through all sci-fi related content sourced from TMDB. The core differentiator is powerful multi-criteria search with AND logic across all content dimensions.

## Art Direction

### Theme: Sci-Fi / Futuristic
- **Color palette**: Deep space dark backgrounds, electric cyan/teal accents, subtle purple highlights
- **Typography**: Clean, modern sans-serif with a slightly technical feel
- **Imagery**: TMDB poster and backdrop images, gradient overlays
- **Motion**: Subtle glow effects, smooth transitions, fade-in animations
- **Overall feel**: Dark, immersive, cinematic — like browsing a command terminal from the future

### Color System (HSL for Tailwind)

**Dark mode (primary — sci-fi sites default to dark)**:
| Role | HSL | Hex Approx |
|---|---|---|
| Background | 220 25% 6% | #0d1117 |
| Surface / Card | 220 20% 10% | #151b23 |
| Surface-2 | 220 18% 13% | #1c2333 |
| Border | 220 15% 20% | #2a3444 |
| Text | 210 15% 88% | #d8dee9 |
| Text muted | 215 10% 55% | #7e8a9a |
| Primary (Cyan) | 185 80% 50% | #1ab8c4 |
| Primary hover | 185 80% 40% | #128a93 |
| Accent (Purple) | 265 60% 60% | #8b5cf6 |
| Ring / Focus | 185 80% 50% | #1ab8c4 |

**Light mode (secondary)**:
| Role | HSL | Hex Approx |
|---|---|---|
| Background | 220 20% 97% | #f4f6f9 |
| Surface / Card | 0 0% 100% | #ffffff |
| Border | 220 15% 85% | #d1d5db |
| Text | 220 25% 12% | #171e2a |
| Text muted | 215 10% 45% | #6b7280 |
| Primary (Cyan) | 185 80% 38% | #0f8a94 |

## Pages and Navigation

### Page Structure

| Page | Route | Description |
|---|---|---|
| Home / Search | `/#/` | Primary search interface with results |
| Movie Detail | `/#/movie/:id` | Full movie details page |
| TV Series Detail | `/#/tv/:id` | Full TV series details page |
| Person Detail | `/#/person/:id` | Actor/director filmography |
| Browse | `/#/browse` | Category-based browsing (trending, top rated, etc.) |

### Navigation
- **Top navigation bar** (fixed): Logo, search toggle, browse link, theme toggle
- **No sidebar** — the interface is search-centric, not navigation-heavy
- Mobile: hamburger menu for navigation links

## Core Feature: Multi-Criteria Search

### Search Interface Design

The search page features a prominent search bar with an expandable advanced filters panel below it.

#### Quick Search Bar
- Full-width text input at the top
- Searches across: title, overview, tagline, cast names, crew names, keywords
- Powered by FTS5 full-text search
- Real-time results as user types (debounced 300ms)
- Results appear below the search bar

#### Advanced Filters Panel
Expandable section below the quick search bar. All filters combine with AND logic.

| Filter | UI Component | Description |
|---|---|---|
| Content Type | Toggle: Movies / TV / Both | Filter by media type |
| Title | Text input | Search within titles only |
| Description | Text input | Search within overviews |
| Cast | Combobox with autocomplete | Search by actor name |
| Director/Creator | Combobox with autocomplete | Search by director (movies) or creator (TV) |
| Release Year Range | Dual slider or min/max inputs | Filter by year range |
| Status | Multi-select dropdown | Released, Post Production, In Production, Planned, etc. |
| Original Language | Searchable dropdown | ISO 639-1 language codes with display names |
| Rating Range | Dual slider (0-10) | Minimum and maximum TMDB rating |
| Minimum Votes | Number input | Ensure statistical significance |
| Sort By | Dropdown | Popularity, Rating, Release Date, Title (asc/desc) |
| Keywords | Combobox with autocomplete | TMDB keyword tags |

#### Filter Behavior
- All active filters displayed as removable chips/badges above results
- "Clear all filters" button when any filter is active
- Filter state preserved in URL hash parameters for shareability
- Filters are applied with AND logic: all conditions must be true
- Empty/unset filters are ignored

### Search Results

#### Results Grid
- Responsive grid: 5 columns (desktop) → 3 (tablet) → 2 (mobile)
- Each result card shows:
  - Poster image (with lazy loading + skeleton placeholder)
  - Title (truncated to 2 lines)
  - Year
  - Rating badge (color-coded: green ≥7, yellow ≥5, red <5)
  - Content type badge (Movie / TV)
- Hover: subtle scale + glow effect, shows overview excerpt

#### Pagination
- Infinite scroll with "Load More" button fallback
- 20 results per page
- Total results count displayed
- Smooth scroll-to-top button

### Movie Detail Page

Layout: Full-width backdrop image at top with gradient overlay.

#### Header Section
- Backdrop image (full width, 40vh height)
- Poster (left-aligned, overlapping backdrop)
- Title + original title
- Release date + runtime + status
- Rating (visual star/score display)
- Tagline (italic)
- Genre badges
- Action buttons: Visit TMDB page, Visit IMDB page

#### Body Section
- **Overview**: Full synopsis
- **Top Cast**: Horizontal scrollable row of cast cards (photo, name, character)
- **Crew**: Director(s), Writer(s), Producer(s) listed
- **Details Panel**:
  - Original Language
  - Budget / Revenue
  - Production Companies
  - Keywords (clickable — navigate to search with keyword filter)
  - Spoken Languages
- **Recommendations**: If available, similar sci-fi titles (from TMDB data or same-keyword matches)

### TV Series Detail Page

Similar layout to Movie Detail, with additional fields:
- First Air Date / Last Air Date
- Number of Seasons / Episodes
- Episode Runtime
- Networks
- Status (Returning, Ended, Canceled)

### Person Detail Page

- Profile photo
- Name
- Known for department
- Filmography: grouped by role (Actor, Director, etc.), sorted by date
- Each filmography entry links to the movie/TV detail page

### Browse Page

Curated lists for discovery:
- **Trending**: Sorted by TMDB popularity
- **Top Rated**: Sorted by vote_average (with minimum vote_count threshold)
- **Recently Released**: Last 3 months
- **Upcoming**: Status = "Post Production" or future release dates
- **Classic Sci-Fi**: Released before 2000, sorted by rating
- Each section is a horizontal scrollable row with "See All" link

## API Endpoints

### Search
| Method | Path | Description |
|---|---|---|
| GET | `/api/search` | Multi-criteria search with all filters |

Query parameters match the filter fields. Returns paginated results.

### Movies
| Method | Path | Description |
|---|---|---|
| GET | `/api/movies/:id` | Movie details with cast, crew, genres, keywords |
| GET | `/api/movies/trending` | Top movies by popularity |
| GET | `/api/movies/top-rated` | Top movies by rating |
| GET | `/api/movies/recent` | Recently released movies |
| GET | `/api/movies/upcoming` | Upcoming movies |

### TV Series
| Method | Path | Description |
|---|---|---|
| GET | `/api/tv/:id` | TV series details with cast, crew, genres |
| GET | `/api/tv/trending` | Top TV series by popularity |
| GET | `/api/tv/top-rated` | Top TV series by rating |

### Autocomplete
| Method | Path | Description |
|---|---|---|
| GET | `/api/autocomplete/people` | People name search (for cast/crew filters) |
| GET | `/api/autocomplete/keywords` | Keyword search |

### Stats
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Database statistics (total movies, TV series, last sync) |

## Responsive Design

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640–1024px | 2-3 column grid |
| Desktop | > 1024px | 4-5 column grid, expanded filters |

## Performance Requirements

- First Contentful Paint: < 1.5s
- Search response time: < 200ms for FTS queries
- Image lazy loading for all TMDB images
- Skeleton loading states for all async content
- Client-side caching via TanStack Query (5 minute stale time)

## TMDB Attribution

Per TMDB API terms of service:
- TMDB logo displayed in the footer
- Attribution text: "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Link to TMDB for each movie/TV series
