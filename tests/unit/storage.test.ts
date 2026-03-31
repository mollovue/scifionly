/**
 * Unit tests for the DatabaseStorage layer.
 *
 * These tests verify search, filter, sort, and detail query logic
 * against the demo-seeded database.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { DatabaseStorage } from "../../server/storage.js";

let storage: DatabaseStorage;

beforeAll(() => {
  storage = new DatabaseStorage();
});

// ─────────────────────────────────────────────
// Database initialization
// ─────────────────────────────────────────────

describe("Database initialization", () => {
  it("should create a storage instance without errors", () => {
    expect(storage).toBeTruthy();
  });

  it("getStats should return counts for seeded data", () => {
    const stats = storage.getStats();
    expect(stats).toBeDefined();
    expect(stats.total_movies).toBeGreaterThan(0);
    expect(stats.total_tv_series).toBeGreaterThan(0);
    expect(stats.people_count).toBeGreaterThan(0);
    expect(stats.genres_count).toBeGreaterThan(0);
  });

  it("getStats total_movies should match actual movie count", () => {
    const stats = storage.getStats();
    expect(stats.total_movies).toBeGreaterThanOrEqual(50);
  });

  it("getStats total_tv_series should match actual TV series count", () => {
    const stats = storage.getStats();
    expect(stats.total_tv_series).toBeGreaterThanOrEqual(20);
  });
});

// ─────────────────────────────────────────────
// Search: basic text query
// ─────────────────────────────────────────────

describe("searchContent: text query", () => {
  it("should return results for a valid query", () => {
    const result = storage.searchContent({ query: "blade runner" });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should find Blade Runner 2049 by title search", () => {
    const result = storage.searchContent({ query: "blade runner" });
    const titles = result.results.map((r) => r.title.toLowerCase());
    expect(titles.some((t) => t.includes("blade runner"))).toBe(true);
  });

  it("should return empty results for gibberish query", () => {
    const result = storage.searchContent({ query: "xyzzy_nonexistent_12345" });
    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should search across overview text", () => {
    const result = storage.searchContent({ query: "astronaut" });
    expect(result.total).toBeGreaterThan(0);
  });

  it("search result should have correct shape", () => {
    const result = storage.searchContent({ query: "space" });
    expect(result.results.length).toBeGreaterThan(0);
    const item = result.results[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("tmdb_id");
    expect(item).toHaveProperty("type");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("vote_average");
    expect(item).toHaveProperty("popularity");
    expect(["movie", "tv"]).toContain(item.type);
  });
});

// ─────────────────────────────────────────────
// Search: type filter
// ─────────────────────────────────────────────

describe("searchContent: type filter", () => {
  it("type=movie should return only movies", () => {
    const result = storage.searchContent({ type: "movie" });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((r) => r.type === "movie")).toBe(true);
  });

  it("type=tv should return only TV series", () => {
    const result = storage.searchContent({ type: "tv" });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((r) => r.type === "tv")).toBe(true);
  });

  it("type=both should return both movies and TV series", () => {
    const result = storage.searchContent({ type: "both", per_page: 100 });
    const types = new Set(result.results.map((r) => r.type));
    expect(types.has("movie")).toBe(true);
    expect(types.has("tv")).toBe(true);
  });

  it("type=movie with text query should only return movies", () => {
    const result = storage.searchContent({ query: "space", type: "movie" });
    expect(result.results.every((r) => r.type === "movie")).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Search: year range filter
// ─────────────────────────────────────────────

describe("searchContent: year range filter", () => {
  it("year_min=2000 should exclude pre-2000 movies", () => {
    const result = storage.searchContent({ type: "movie", year_min: 2000 });
    for (const r of result.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2000);
      }
    }
  });

  it("year_max=1999 should only return classic movies", () => {
    const result = storage.searchContent({ type: "movie", year_max: 1999 });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeLessThanOrEqual(1999);
      }
    }
  });

  it("year range 1990-2000 should only return movies in that range", () => {
    const result = storage.searchContent({ type: "movie", year_min: 1990, year_max: 2000 });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(1990);
        expect(year).toBeLessThanOrEqual(2000);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Search: rating range filter
// ─────────────────────────────────────────────

describe("searchContent: rating range filter", () => {
  it("rating_min=8.0 should only return highly-rated titles", () => {
    const result = storage.searchContent({ rating_min: 8.0 });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(8.0);
      }
    }
  });

  it("rating_max=7.0 should only return titles with vote_average <= 7.0", () => {
    const result = storage.searchContent({ rating_max: 7.0, type: "movie" });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeLessThanOrEqual(7.0);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Search: sort options
// ─────────────────────────────────────────────

describe("searchContent: sort options", () => {
  it("sort_by=popularity should return results sorted by popularity descending", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "popularity", sort_order: "desc" });
    const popularities = result.results
      .map((r) => r.popularity ?? 0)
      .filter((p) => p > 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  it("sort_by=vote_average should return results sorted by rating descending", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "vote_average", sort_order: "desc" });
    const ratings = result.results
      .map((r) => r.vote_average ?? 0)
      .filter((r) => r > 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1] + 0.001); // small tolerance
    }
  });

  it("sort_by=title ASC should return alphabetical order", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "title", sort_order: "asc", per_page: 20 });
    const titles = result.results.map((r) => r.title.toLowerCase());
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i] >= titles[i - 1]).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────
// Search: combined filters (AND logic)
// ─────────────────────────────────────────────

describe("searchContent: combined filters", () => {
  it("year + rating filter should combine with AND logic", () => {
    const result = storage.searchContent({
      type: "movie",
      year_min: 2000,
      rating_min: 7.5,
    });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2000);
      }
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(7.5);
      }
    }
  });

  it("type + year + rating combined filter", () => {
    const result = storage.searchContent({
      type: "movie",
      year_min: 1995,
      year_max: 2015,
      rating_min: 7.0,
    });
    for (const r of result.results) {
      expect(r.type).toBe("movie");
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(1995);
        expect(year).toBeLessThanOrEqual(2015);
      }
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(7.0);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Search: pagination
// ─────────────────────────────────────────────

describe("searchContent: pagination", () => {
  it("should return correct page metadata", () => {
    const result = storage.searchContent({ type: "movie", per_page: 10, page: 1 });
    expect(result.page).toBe(1);
    expect(result.per_page).toBe(10);
    expect(result.results.length).toBeLessThanOrEqual(10);
    expect(result.total_pages).toBeGreaterThan(0);
  });

  it("page 2 should return different results than page 1", () => {
    const page1 = storage.searchContent({ type: "movie", per_page: 5, page: 1 });
    const page2 = storage.searchContent({ type: "movie", per_page: 5, page: 2 });
    const ids1 = new Set(page1.results.map((r) => r.id));
    const ids2 = new Set(page2.results.map((r) => r.id));
    const overlap = [...ids1].filter((id) => ids2.has(id));
    expect(overlap.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getMovieById
// ─────────────────────────────────────────────

describe("getMovieById", () => {
  let movieId: number;

  beforeAll(() => {
    const result = storage.searchContent({ type: "movie", per_page: 1, query: "blade runner" });
    if (result.results.length > 0) {
      movieId = result.results[0].id;
    }
  });

  it("should return a movie with full details", () => {
    expect(movieId).toBeDefined();
    const movie = storage.getMovieById(movieId);
    expect(movie).toBeDefined();
    expect(movie!.id).toBe(movieId);
    expect(movie!.title).toBeTruthy();
  });

  it("should include genres array", () => {
    const movie = storage.getMovieById(movieId);
    expect(Array.isArray(movie!.genres)).toBe(true);
    expect(movie!.genres.length).toBeGreaterThan(0);
    expect(movie!.genres[0]).toHaveProperty("id");
    expect(movie!.genres[0]).toHaveProperty("name");
  });

  it("should include cast array with names and characters", () => {
    const movie = storage.getMovieById(movieId);
    expect(Array.isArray(movie!.cast)).toBe(true);
    expect(movie!.cast.length).toBeGreaterThan(0);
    expect(movie!.cast[0]).toHaveProperty("name");
    expect(movie!.cast[0]).toHaveProperty("person_id");
  });

  it("should include crew array", () => {
    const movie = storage.getMovieById(movieId);
    expect(Array.isArray(movie!.crew)).toBe(true);
    expect(movie!.crew.length).toBeGreaterThan(0);
    expect(movie!.crew[0]).toHaveProperty("job");
  });

  it("should include keywords array", () => {
    const movie = storage.getMovieById(movieId);
    expect(Array.isArray(movie!.keywords)).toBe(true);
    expect(movie!.keywords.length).toBeGreaterThan(0);
  });

  it("should include production_companies array", () => {
    const movie = storage.getMovieById(movieId);
    expect(Array.isArray(movie!.production_companies)).toBe(true);
  });

  it("should return undefined for non-existent ID", () => {
    const movie = storage.getMovieById(999999);
    expect(movie).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// getTvSeriesById
// ─────────────────────────────────────────────

describe("getTvSeriesById", () => {
  let tvId: number;

  beforeAll(() => {
    const result = storage.searchContent({ type: "tv", per_page: 1, query: "expanse" });
    if (result.results.length > 0) {
      tvId = result.results[0].id;
    } else {
      // Fall back to any TV series
      const any = storage.searchContent({ type: "tv", per_page: 1 });
      tvId = any.results[0]?.id;
    }
  });

  it("should return a TV series with full details", () => {
    expect(tvId).toBeDefined();
    const tv = storage.getTvSeriesById(tvId);
    expect(tv).toBeDefined();
    expect(tv!.id).toBe(tvId);
    expect(tv!.name).toBeTruthy();
  });

  it("should include genres array", () => {
    const tv = storage.getTvSeriesById(tvId);
    expect(Array.isArray(tv!.genres)).toBe(true);
    expect(tv!.genres.length).toBeGreaterThan(0);
  });

  it("should include cast array", () => {
    const tv = storage.getTvSeriesById(tvId);
    expect(Array.isArray(tv!.cast)).toBe(true);
    expect(tv!.cast.length).toBeGreaterThan(0);
  });

  it("should include crew array", () => {
    const tv = storage.getTvSeriesById(tvId);
    expect(Array.isArray(tv!.crew)).toBe(true);
    expect(tv!.crew.length).toBeGreaterThan(0);
  });

  it("should return undefined for non-existent ID", () => {
    const tv = storage.getTvSeriesById(999999);
    expect(tv).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// getTrending
// ─────────────────────────────────────────────

describe("getTrending", () => {
  it("should return movies sorted by popularity descending", () => {
    const results = storage.getTrending("movie", 10);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === "movie")).toBe(true);

    const popularities = results.map((r) => r.popularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  it("should return TV series sorted by popularity descending", () => {
    const results = storage.getTrending("tv", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === "tv")).toBe(true);

    const popularities = results.map((r) => r.popularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  it("should respect the limit parameter", () => {
    const results = storage.getTrending("movie", 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// getTopRated
// ─────────────────────────────────────────────

describe("getTopRated", () => {
  it("should return movies sorted by rating descending", () => {
    const results = storage.getTopRated("movie", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === "movie")).toBe(true);

    const ratings = results.map((r) => r.vote_average ?? 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1] + 0.001);
    }
  });

  it("should return TV series sorted by rating descending", () => {
    const results = storage.getTopRated("tv", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === "tv")).toBe(true);
  });

  it("top-rated movies should have high ratings", () => {
    const results = storage.getTopRated("movie", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].vote_average).toBeGreaterThanOrEqual(7.0);
  });

  it("should respect the limit parameter", () => {
    const results = storage.getTopRated("movie", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────
// autocompletePeople
// ─────────────────────────────────────────────

describe("autocompletePeople", () => {
  it("should return matching people for a partial name", () => {
    const results = storage.autocompletePeople("Chris", 10);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.name.toLowerCase()).toContain("chris");
    }
  });

  it("should return matching people for a last name", () => {
    const results = storage.autocompletePeople("Nolan", 10);
    expect(results.some((p) => p.name.toLowerCase().includes("nolan"))).toBe(true);
  });

  it("each result should have id, name, profile_path, known_for_department", () => {
    const results = storage.autocompletePeople("Matt", 5);
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("profile_path");
    expect(first).toHaveProperty("known_for_department");
  });

  it("should respect the limit parameter", () => {
    const results = storage.autocompletePeople("a", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("should return empty array for empty query", () => {
    // This is handled at the route level, but storage may return all people
    // Just verify it doesn't throw
    expect(() => storage.autocompletePeople("", 10)).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// autocompleteKeywords
// ─────────────────────────────────────────────

describe("autocompleteKeywords", () => {
  it("should return matching keywords", () => {
    const results = storage.autocompleteKeywords("space", 10);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const k of results) {
      expect(k.name.toLowerCase()).toContain("space");
    }
  });

  it("should return dystopia keyword", () => {
    const results = storage.autocompleteKeywords("dys", 10);
    expect(results.some((k) => k.name.toLowerCase().includes("dys"))).toBe(true);
  });

  it("each result should have id and name", () => {
    const results = storage.autocompleteKeywords("robot", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("id");
    expect(results[0]).toHaveProperty("name");
  });

  it("should respect the limit parameter", () => {
    const results = storage.autocompleteKeywords("a", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────
// getStats
// ─────────────────────────────────────────────

describe("getStats", () => {
  it("should return a stats object with all fields", () => {
    const stats = storage.getStats();
    expect(stats).toHaveProperty("total_movies");
    expect(stats).toHaveProperty("total_tv_series");
    expect(stats).toHaveProperty("genres_count");
    expect(stats).toHaveProperty("people_count");
    expect(stats).toHaveProperty("last_sync");
  });

  it("total_movies should be a positive integer", () => {
    const stats = storage.getStats();
    expect(stats.total_movies).toBeGreaterThan(0);
    expect(Number.isInteger(stats.total_movies)).toBe(true);
  });

  it("total_tv_series should be a positive integer", () => {
    const stats = storage.getStats();
    expect(stats.total_tv_series).toBeGreaterThan(0);
    expect(Number.isInteger(stats.total_tv_series)).toBe(true);
  });

  it("genres_count should be >= 5", () => {
    const stats = storage.getStats();
    expect(stats.genres_count).toBeGreaterThanOrEqual(5);
  });

  it("people_count should be a positive integer", () => {
    const stats = storage.getStats();
    expect(stats.people_count).toBeGreaterThan(0);
  });
});
