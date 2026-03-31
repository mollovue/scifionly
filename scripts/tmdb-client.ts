/**
 * TMDB API v3 client utility.
 * Handles rate limiting, retries with exponential backoff, and typed responses.
 */

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const RATE_LIMIT_MS = Number(process.env.SYNC_RATE_LIMIT_MS) || 300; // ~3 req/s
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 30_000;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  character?: string;
  order?: number;
  job?: string;
  department?: string;
}

export interface TmdbKeyword {
  id: number;
  name: string;
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  status: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  budget: number;
  revenue: number;
  original_language: string;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  tagline: string;
  homepage: string;
  imdb_id: string | null;
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  credits: {
    cast: TmdbPerson[];
    crew: TmdbPerson[];
  };
  keywords: {
    keywords: TmdbKeyword[];
  };
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  tagline: string;
  homepage: string;
  networks: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
  genres: TmdbGenre[];
  production_companies: TmdbProductionCompany[];
  credits: {
    cast: TmdbPerson[];
    crew: TmdbPerson[];
  };
  keywords: {
    results: TmdbKeyword[];
  };
}

export interface TmdbDiscoverPage {
  page: number;
  results: Array<{ id: number; [key: string]: unknown }>;
  total_pages: number;
  total_results: number;
}

export interface TmdbChangesPage {
  results: Array<{ id: number; adult: boolean }>;
  page: number;
  total_pages: number;
  total_results: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a TMDB endpoint with:
 * - Rate limiting (RATE_LIMIT_MS delay between calls)
 * - Exponential backoff on 429 responses
 * - Retry on network/5xx errors
 * - Request timeout
 */
let _lastRequestAt = 0;

export async function tmdbFetch(
  endpoint: string,
  params?: Record<string, string>
): Promise<unknown> {
  if (!TMDB_API_KEY) {
    throw new Error(
      "TMDB_API_KEY environment variable is not set. " +
        "Get a Bearer token from https://www.themoviedb.org/settings/api"
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    // Rate limiting — enforce minimum gap between requests
    const now = Date.now();
    const sinceLastRequest = now - _lastRequestAt;
    if (sinceLastRequest < RATE_LIMIT_MS) {
      await sleep(RATE_LIMIT_MS - sinceLastRequest);
    }
    _lastRequestAt = Date.now();

    let response: Response;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch (err: unknown) {
      const isAbort =
        err instanceof Error && err.name === "AbortError";
      const message = err instanceof Error ? err.message : String(err);

      if (isAbort) {
        console.warn(`[tmdb-client] Request timeout on ${endpoint} (attempt ${attempt + 1})`);
      } else {
        console.warn(`[tmdb-client] Network error on ${endpoint}: ${message} (attempt ${attempt + 1})`);
      }

      attempt++;
      if (attempt > MAX_RETRIES) throw err;
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 60_000);
      await sleep(backoff);
      continue;
    }

    // 429 — rate limited
    if (response.status === 429) {
      attempt++;
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(1000 * Math.pow(2, attempt), 60_000);
      console.warn(
        `[tmdb-client] Rate limited (429) on ${endpoint}. Waiting ${waitMs}ms (attempt ${attempt})`
      );
      await sleep(waitMs);
      continue;
    }

    // 5xx — server error
    if (response.status >= 500) {
      attempt++;
      if (attempt > 3) {
        console.error(
          `[tmdb-client] Server error ${response.status} on ${endpoint} after ${attempt} attempts — skipping`
        );
        throw new Error(`TMDB server error ${response.status} on ${endpoint}`);
      }
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 60_000);
      console.warn(
        `[tmdb-client] Server error ${response.status} on ${endpoint}. Retrying in ${backoff}ms (attempt ${attempt})`
      );
      await sleep(backoff);
      continue;
    }

    // 404 — not found (skip gracefully)
    if (response.status === 404) {
      throw new Error(`TMDB 404: ${endpoint}`);
    }

    if (!response.ok) {
      throw new Error(`TMDB HTTP ${response.status} on ${endpoint}`);
    }

    return response.json();
  }

  throw new Error(`[tmdb-client] Exhausted retries for ${endpoint}`);
}

// ─────────────────────────────────────────────
// API methods
// ─────────────────────────────────────────────

/**
 * Discover sci-fi movies (genre 878), sorted by popularity.
 * Pages are 1-indexed; max 500 pages (10,000 results).
 */
export async function discoverSciFiMovies(page: number = 1): Promise<TmdbDiscoverPage> {
  return tmdbFetch("/discover/movie", {
    with_genres: "878",
    sort_by: "popularity.desc",
    page: String(page),
    include_adult: "false",
    include_video: "false",
  }) as Promise<TmdbDiscoverPage>;
}

/**
 * Discover sci-fi TV series (genre 10765), sorted by popularity.
 */
export async function discoverSciFiTV(page: number = 1): Promise<TmdbDiscoverPage> {
  return tmdbFetch("/discover/tv", {
    with_genres: "10765",
    sort_by: "popularity.desc",
    page: String(page),
  }) as Promise<TmdbDiscoverPage>;
}

/**
 * Get full movie details including credits and keywords in a single request.
 */
export async function getMovieDetails(id: number): Promise<TmdbMovieDetails> {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "credits,keywords",
  }) as Promise<TmdbMovieDetails>;
}

/**
 * Get full TV series details including credits and keywords.
 */
export async function getTVDetails(id: number): Promise<TmdbTvDetails> {
  return tmdbFetch(`/tv/${id}`, {
    append_to_response: "credits,keywords",
  }) as Promise<TmdbTvDetails>;
}

/**
 * Get IDs of movies changed within a date range.
 * Date format: YYYY-MM-DD. Maximum range: 14 days.
 */
export async function getMovieChanges(
  startDate: string,
  endDate: string,
  page: number = 1
): Promise<TmdbChangesPage> {
  return tmdbFetch("/movie/changes", {
    start_date: startDate,
    end_date: endDate,
    page: String(page),
  }) as Promise<TmdbChangesPage>;
}

/**
 * Get IDs of TV series changed within a date range.
 * Date format: YYYY-MM-DD. Maximum range: 14 days.
 */
export async function getTVChanges(
  startDate: string,
  endDate: string,
  page: number = 1
): Promise<TmdbChangesPage> {
  return tmdbFetch("/tv/changes", {
    start_date: startDate,
    end_date: endDate,
    page: String(page),
  }) as Promise<TmdbChangesPage>;
}

/**
 * Fetch genre lists for both movies and TV series, returning a combined unique set.
 */
export async function getGenreList(): Promise<TmdbGenre[]> {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch("/genre/movie/list") as Promise<{ genres: TmdbGenre[] }>,
    tmdbFetch("/genre/tv/list") as Promise<{ genres: TmdbGenre[] }>,
  ]);

  const genreMap = new Map<number, TmdbGenre>();
  for (const g of movieGenres.genres) genreMap.set(g.id, g);
  for (const g of tvGenres.genres) genreMap.set(g.id, g);

  return Array.from(genreMap.values()).sort((a, b) => a.id - b.id);
}

/**
 * Paginate through all pages of a TMDB discover/changes endpoint
 * and collect all results.
 */
export async function paginateAll<T extends { id: number }>(
  fetchPage: (page: number) => Promise<{ results: T[]; total_pages: number; total_results: number }>,
  maxPages: number = 500,
  onProgress?: (current: number, total: number) => void
): Promise<T[]> {
  const firstPage = await fetchPage(1);
  const totalPages = Math.min(firstPage.total_pages, maxPages);

  if (onProgress) onProgress(1, totalPages);

  const results: T[] = [...firstPage.results];

  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(page);
    results.push(...data.results);
    if (onProgress) onProgress(page, totalPages);
  }

  return results;
}
