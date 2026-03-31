# SciFi Only — Mobile App Screen Design Specification

## Overview

This document specifies every screen, component, and interaction for the SciFi Only Flutter mobile app. The app mirrors the web app's features (search, browse, detail views, person filmography) while adapting the UI for touch-first mobile use. The app is standalone — powered by a local SQLite database imported via file picker.

## Navigation Architecture

### Bottom Navigation Bar
Three tabs provide the app's top-level navigation:

| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| Search | `Icons.search` | Search | `/` |
| Browse | `Icons.explore` | Browse | `/browse` |
| Settings | `Icons.settings` | Settings | `/settings` |

- Active tab uses Primary Cyan color; inactive tabs use Text Muted
- Each tab maintains its own navigation stack (GoRouter `StatefulShellRoute`)
- Back gestures navigate within the current tab's stack before switching tabs

### Deep Routes (push onto tab stack)

| Route | Screen |
|-------|--------|
| `/movie/:id` | Movie Detail |
| `/tv/:id` | TV Series Detail |
| `/person/:id` | Person Detail |

---

## Screen 1: Search / Home

The default landing screen. Hero banner at the top, search bar, active filter chips, results grid, and a "Trending Now" section when no search is active.

### 1.1 Hero Section
- Full-width container with gradient background (Background → Surface)
- App title: "SciFi Only" in `headlineMedium` (Exo 2, bold)
- Subtitle: "Explore the Sci-Fi Universe" in `bodyLarge` (Text Muted)
- Stats row: "{N} Movies" and "{N} TV Series" as small `Chip` widgets with Primary Cyan text
- Height: 140dp

### 1.2 Search Bar
- `TextField` with rounded border, search icon prefix, clear icon suffix (when text present)
- Placeholder: "Search movies, TV shows, cast, crew..."
- Positioned directly below the hero section
- Debounced input: 300ms delay before triggering search
- Horizontal padding: 16dp

### 1.3 Filter Section
- Expandable via an "Advanced Filters" `TextButton` with a chevron icon
- Expands inline (not a bottom sheet) to show filter controls
- Filter controls:
  - **Content Type**: `SegmentedButton` with 3 options: All / Movies / TV
  - **Year Range**: Two `TextField` inputs (min/max, 4-digit year, numeric keyboard)
  - **Rating Range**: `RangeSlider` from 0.0 to 10.0, step 0.5, with labels
  - **Minimum Votes**: `TextField` (numeric keyboard)
  - **Status**: `DropdownButtonFormField` (Released, Post Production, In Production, Planned, Returning Series, Ended, Canceled)
  - **Language**: `DropdownButtonFormField` with searchable items (ISO 639-1 codes with display names)
  - **Sort By**: `DropdownButtonFormField` (Popularity, Rating, Release Date, Title)
  - **Sort Order**: `SegmentedButton` (Desc / Asc)
- "Apply Filters" primary button at bottom of filter section
- "Reset Filters" text button

### 1.4 Active Filter Chips
- Horizontal scrollable row of `Chip` widgets below search bar
- Each chip shows the filter name and value (e.g., "Year: 2020–2024")
- Chips have a delete icon (×) that removes that filter
- "Clear all" chip at the end when more than one filter is active
- Hidden when no filters are active

### 1.5 Results Grid
- 2-column `GridView` on phones (<600dp), 3-column on tablets (≥600dp)
- Each cell is a `ContentCard` (see Components section)
- "Load More" button at the bottom after 20 results (pagination)
- Total results count shown above the grid: "{N} results"
- Smooth scroll-to-top FloatingActionButton appears after scrolling down

### 1.6 Trending Section (No Search Active)
- Shown when the search bar is empty and no filters active
- Section header: "Trending Now" with `titleLarge`
- Horizontal scrollable row of `ContentCard` widgets (compact variant)
- Mixes movies + TV sorted by popularity DESC
- Shows 20 items

### 1.7 Empty / Error States
- **No results**: Illustration placeholder + "No results found. Try adjusting your filters."
- **No database**: "No database loaded. Import a database from Settings." with a button linking to Settings
- **Error**: "Something went wrong" with "Retry" button

---

## Screen 2: Browse

Category-based discovery with horizontal scrollable rows.

### 2.1 Layout
- Vertical `ListView` of category sections
- Each section has a header row and a horizontal scrollable content row
- Pull-to-refresh reloads all categories

### 2.2 Category Sections

#### Movies
| Category | Query | Sort |
|----------|-------|------|
| Trending Movies | All movies | popularity DESC |
| Top Rated Movies | vote_count > 50 | vote_average DESC |
| Recently Released | release_date within last 3 months | release_date DESC |

#### TV Series
| Category | Query | Sort |
|----------|-------|------|
| Trending TV Series | All TV series | popularity DESC |
| Top Rated TV Series | vote_count > 50 | vote_average DESC |
| Recently Aired | first_air_date within last 3 months | first_air_date DESC |

### 2.3 Section Header
- Row with category title (`titleMedium`, bold) on the left
- "See All >" text button on the right (Primary Cyan)
- "See All" navigates to Search screen with the category's filters pre-applied

### 2.4 Horizontal Content Row
- `ListView.builder` with horizontal scroll direction
- Each item is a compact `ContentCard` (width: 140dp)
- 20 items per row
- 12dp gap between cards
- 16dp horizontal padding at start and end

---

## Screen 3: Movie Detail

Full movie details with backdrop hero, poster, metadata, cast, crew, and details panel.

### 3.1 Backdrop Hero
- Full-width backdrop image at the top (height: 280dp)
- Gradient overlay from transparent to Background color (bottom 60%)
- If no backdrop image: solid Surface color with a subtle star-field pattern
- Back button (arrow_back) in top-left corner with circular semi-transparent background

### 3.2 Poster + Title Section
- Poster image (width: 120dp) positioned to overlap the backdrop by 40dp
- Aligned to the left with 16dp margin
- Right of the poster:
  - Title in `titleLarge` (bold)
  - Original title below (if different from title) in `bodyMedium` (Text Muted, italic)
  - Year + Runtime + Status row: "2024 · 148 min · Released" in `bodySmall`
  - Rating badge: colored circle with score (green ≥7, amber ≥5, red <5) + vote count

### 3.3 Tagline
- Italic `bodyMedium` text in Text Muted color
- 16dp horizontal padding
- Hidden if tagline is null/empty

### 3.4 Genre Badges
- Horizontal wrap of `Chip` widgets
- Each chip shows genre name
- Tapping a genre navigates to Search with that genre's movies (future enhancement — for now, non-interactive)

### 3.5 Action Buttons Row
- Horizontal row of icon buttons:
  - **Share** (`share` icon) — uses share_plus to share title + TMDB link
  - **TMDB** (custom icon or text) — opens TMDB page in browser
  - **IMDB** (custom icon or text) — opens IMDB page in browser (if imdb_id available)
- Buttons use `OutlinedButton.icon` style with Primary Cyan border

### 3.6 Overview Section
- Section header: "Overview" in `titleMedium`
- Overview text in `bodyMedium`
- TTS button (volume_up icon) next to the section header — plays overview via flutter_tts
- TTS button toggles between play and stop states

### 3.7 Top Cast Section
- Section header: "Top Cast" in `titleMedium`
- Horizontal scrollable row of `CastCard` widgets (max 15 cast members)
- Each card: profile photo (circular, 64dp), name, character name
- Tapping a cast card navigates to `/person/:id`

### 3.8 Crew Section
- Section header: "Crew" in `titleMedium`
- Grouped by role: Directors, Writers, Producers
- Each person shown as a row: name (bold) + job title
- Tapping a crew member navigates to `/person/:id`

### 3.9 Details Panel
- Card with Surface background
- Rows of label/value pairs:
  - Original Language: display name (e.g., "English")
  - Budget: formatted currency (e.g., "$200,000,000") — hidden if 0 or null
  - Revenue: formatted currency — hidden if 0 or null
  - Production Companies: comma-separated names
  - Keywords: horizontal wrap of small `Chip` widgets
  - Spoken Languages: comma-separated display names

### 3.10 TMDB Attribution
- Small text at the bottom: "Data provided by TMDB" with TMDB logo/icon
- `bodySmall`, Text Muted color

---

## Screen 4: TV Series Detail

Similar to Movie Detail with TV-specific fields.

### 4.1 Shared Sections
Same as Movie Detail: Backdrop Hero (3.1), Poster + Title Section (3.2 adapted), Tagline (3.3), Genre Badges (3.4), Action Buttons (3.5 — no IMDB for TV), Overview (3.6), Top Cast (3.7), Crew (3.8 — "Creators" instead of "Directors"), TMDB Attribution (3.10)

### 4.2 Title Section Adaptations
- Name replaces Title
- First Air Date replaces Release Date
- "2024 · 10 episodes · Returning Series" format
- Episode runtime shown if available

### 4.3 Series Info Section
- Additional card below Genre Badges with:
  - Number of Seasons
  - Number of Episodes
  - First Air Date — Last Air Date (or "Present" if status is "Returning Series")
  - Networks: comma-separated

### 4.4 Details Panel Adaptations
- No Budget/Revenue fields
- Add Networks field
- Add Episode Runtime field

---

## Screen 5: Person Detail

Profile and filmography for a cast/crew member.

### 5.1 Profile Header
- Circular profile photo (120dp diameter) centered at top
- Placeholder icon if no profile_path
- Name in `headlineSmall` (centered, bold)
- Known for department in `bodyMedium` (Text Muted, centered)

### 5.2 Filmography Sections
- Two tabs (or sections): "Movies" and "TV Series"
- Each section is a vertical list of filmography entries
- Each entry is a `ListTile`:
  - Leading: poster thumbnail (40dp wide)
  - Title: movie/TV title
  - Subtitle: role (character name for cast, job title for crew) + year
  - Trailing: rating badge (if available)
- Sorted by date descending
- Tapping navigates to the movie/TV detail screen

### 5.3 Empty State
- "No credits found" if the person has no filmography entries

---

## Screen 6: Settings

App configuration and information.

### 6.1 Database Section
- Section header: "Database"
- Current database status: "Loaded — {N} movies, {N} TV series" or "No database loaded"
- "Import Database" button — opens file_picker for `.db` / `.sqlite` files
- Import progress indicator during file copy
- Success/error snackbar after import

### 6.2 Appearance Section
- Section header: "Appearance"
- Theme toggle: `SwitchListTile` with "Dark Mode" label
- Default: Dark mode ON

### 6.3 About Section
- Section header: "About"
- App name: "SciFi Only"
- Version: from pubspec.yaml
- TMDB attribution text: "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Link to TMDB website

---

## Component Specifications

### ContentCard
Reusable card for search results and browse rows.

**Props**: id, type (movie/tv), title, year, posterPath, voteAverage, mediaType

**Standard Variant** (grid cell):
- Aspect ratio: 2:3 (poster ratio)
- Poster image fills card with rounded corners (12dp radius)
- Gradient overlay at bottom (transparent to black 60%)
- Title overlay at bottom: `bodySmall` (white, bold, max 2 lines, ellipsis)
- Year badge: bottom-left, small text
- Rating badge: top-right corner, circular (24dp), colored (green/amber/red)
- Type badge: top-left corner, "Movie" or "TV" chip
- `InkWell` with ripple on tap → navigates to detail screen
- Elevation: 2dp

**Compact Variant** (browse row):
- Fixed width: 140dp
- Same content as standard but without type badge
- Title below the poster image instead of overlaid

### CastCard
Card for horizontal cast row on detail screens.

**Props**: personId, name, character, profilePath

**Layout**:
- Width: 100dp
- Circular profile photo (64dp diameter)
- Name: `bodySmall` (bold, max 2 lines, centered)
- Character: `labelSmall` (Text Muted, max 2 lines, centered)
- Tap → navigates to `/person/:personId`

### RatingBadge
Colored circular rating display.

**Props**: rating (0-10), size (small/medium/large)

**Colors**:
- Green (#4caf50): rating ≥ 7.0
- Amber (#ffc107): rating ≥ 5.0
- Red (#f44336): rating < 5.0

**Sizes**:
- Small: 24dp diameter, `labelSmall` text (for grid cards)
- Medium: 36dp diameter, `bodySmall` text (for detail pages)
- Large: 48dp diameter, `bodyMedium` text (for hero display)

### TmdbImage
Smart image widget with fallback chain.

**Props**: path, size, imageType (poster/backdrop/profile), mediaType, mediaId

**Loading Strategy**:
1. If path is non-null: load from TMDB CDN `https://image.tmdb.org/t/p/{size}{path}` via `Image.network` with caching
2. On network failure: check local image_cache table for BLOB data (if database contains cached images)
3. Show placeholder icon if both sources fail or path is null

**Sizes**: w342 (poster grid), w500 (poster detail), w780 (backdrop), w185 (profile)

**Placeholder**: Film icon for posters, landscape icon for backdrops, person icon for profiles — centered in a Surface-colored container.

**Loading State**: `Shimmer` effect placeholder (animated gradient)

---

## Theme System

### ThemeExtension: SciFiColors

```dart
class SciFiColors extends ThemeExtension<SciFiColors> {
  final Color background;
  final Color surface;
  final Color surfaceSecondary;
  final Color border;
  final Color textPrimary;
  final Color textMuted;
  final Color primaryCyan;
  final Color primaryCyanHover;
  final Color accentPurple;
}
```

### Dark Theme Colors (Default)
| Token | Hex |
|-------|-----|
| background | #0D1117 |
| surface | #151B23 |
| surfaceSecondary | #1C2333 |
| border | #2A3444 |
| textPrimary | #D8DEE9 |
| textMuted | #7E8A9A |
| primaryCyan | #1AB8C4 |
| primaryCyanHover | #128A93 |
| accentPurple | #8B5CF6 |

### Light Theme Colors
| Token | Hex |
|-------|-----|
| background | #F4F6F9 |
| surface | #FFFFFF |
| surfaceSecondary | #F0F2F5 |
| border | #D1D5DB |
| textPrimary | #171E2A |
| textMuted | #6B7280 |
| primaryCyan | #0F8A94 |
| primaryCyanHover | #0A6B73 |
| accentPurple | #7C4DDB |

### Typography
- Font family: 'Exo 2' via google_fonts package
- Scale follows Material 3 type scale:
  - `displayLarge`: 57sp
  - `headlineMedium`: 28sp
  - `titleLarge`: 22sp
  - `titleMedium`: 16sp (semi-bold)
  - `bodyLarge`: 16sp
  - `bodyMedium`: 14sp
  - `bodySmall`: 12sp
  - `labelSmall`: 11sp

### Spacing Scale
| Token | Value |
|-------|-------|
| xs | 4dp |
| sm | 8dp |
| md | 12dp |
| lg | 16dp |
| xl | 24dp |
| xxl | 32dp |
| xxxl | 48dp |

---

## State Management (Riverpod)

### Provider Architecture

```
DatabaseProvider (StateNotifierProvider)
  └── Holds database instance, import state
  
SearchProvider (StateNotifierProvider)
  └── Holds search query, filters, results, pagination
  └── Depends on DatabaseProvider
  
BrowseProvider (FutureProvider family)
  └── Fetches category data (trending, top rated, recent)
  └── Depends on DatabaseProvider
  
MovieDetailProvider (FutureProvider.family)
  └── Fetches movie by ID with cast/crew/genres
  └── Depends on DatabaseProvider
  
TvDetailProvider (FutureProvider.family)
  └── Fetches TV series by ID with cast/crew/genres
  └── Depends on DatabaseProvider
  
PersonDetailProvider (FutureProvider.family)
  └── Fetches person with filmography
  └── Depends on DatabaseProvider
  
ThemeProvider (StateProvider)
  └── Holds ThemeMode (dark/light)
  
StatsProvider (FutureProvider)
  └── Database stats (movie/TV counts)
  └── Depends on DatabaseProvider
  
TtsProvider (StateNotifierProvider)
  └── Text-to-speech state (playing, text)
```

### Search State

```dart
class SearchState {
  final String query;
  final ContentType contentType; // all, movie, tv
  final int? yearMin;
  final int? yearMax;
  final double? ratingMin;
  final double? ratingMax;
  final int? minVotes;
  final String? status;
  final String? language;
  final SortBy sortBy;
  final SortOrder sortOrder;
  final List<SearchResult> results;
  final int totalResults;
  final int currentPage;
  final bool isLoading;
  final String? error;
}
```

---

## Loading States

All async operations display loading indicators:
- **Screen-level loading**: Centered `CircularProgressIndicator` with Primary Cyan color
- **List/grid loading**: Shimmer skeleton placeholders matching card layout
- **Image loading**: Shimmer rectangle matching image dimensions
- **Pull-to-refresh**: `RefreshIndicator` on Browse screen
- **Pagination loading**: `CircularProgressIndicator` at bottom of results list

## Error States

- **Database not loaded**: Full-screen message with icon, text, and "Import Database" CTA
- **Query error**: Inline error banner above results: "Search failed. Please try again."
- **Detail not found**: "Content not found" with back button
- **Network error** (image loading): Placeholder icon silently replaces broken image

## Accessibility

- All images have semantic labels (contentDescription)
- Interactive elements have minimum 48dp touch targets
- Rating badges include `Semantics` label: "Rating {X} out of 10"
- Screen reader support via `Semantics` widgets on custom components
- Sufficient color contrast ratios (verified for both themes)
- Focus traversal follows visual layout order
- Text scales with system font size settings (no fixed sp clamps)

---

## Gestures and Touch

| Gesture | Context | Action |
|---------|---------|--------|
| Tap | ContentCard | Navigate to detail screen |
| Tap | CastCard | Navigate to person detail |
| Tap | Crew member | Navigate to person detail |
| Tap | Filter chip × | Remove that filter |
| Tap | "Load More" | Fetch next page of results |
| Swipe back | Detail screens | Pop back to previous screen |
| Pull down | Browse screen | Refresh all categories |
| Scroll | Horizontal rows | Pan through items |
| Long press | ContentCard | Show preview tooltip with overview (future) |

---

## Database Import Flow

1. User taps "Import Database" in Settings
2. `file_picker` opens OS file selector (filter: `.db`, `.sqlite`)
3. App copies the selected file to app's documents directory
4. App validates the database (checks for expected tables: movies, tv_series, genres, people, keywords, production_companies, and junction tables)
5. On success: reload all providers, show success snackbar, navigate to Search tab
6. On failure: show error dialog with details, keep previous database

## Seed / Demo Data

For testing and first-run experience, the app includes a built-in mechanism to populate a small demo database:
- A `DatabaseHelper.createDemoDatabase()` method generates a SQLite database with ~10 sample movies and ~5 sample TV series with associated genres, cast, crew, and keywords
- Demo data is created in-memory and saved to the app's documents directory
- Accessible from Settings: "Load Demo Data" button shown when no database is loaded
- Demo entries use well-known sci-fi titles as realistic test fixtures

## Keyboard Behavior

- Scrolling the results grid dismisses the software keyboard
- Tapping outside the search `TextField` dismisses the keyboard
- Submitting the search field (keyboard "search" action) dismisses the keyboard and triggers search

## Connectivity Considerations

The app works fully offline once a database is imported:
- All content data is in the local SQLite database
- TMDB images require network — the app shows placeholder icons when offline
- No API calls are made; the app never contacts a remote server for content data
- The image_cache table provides offline access to previously-viewed images (if the database includes cached images)
