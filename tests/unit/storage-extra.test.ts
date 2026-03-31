/**
 * Additional unit tests for the DatabaseStorage layer.
 *
 * Covers: getPersonById, getRecent, getUpcoming, search filters
 * (status, language, min_votes, keyword_id, cast_id, crew_id),
 * sort order variations, and edge cases.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { DatabaseStorage } from "../../server/storage.js";

let storage: DatabaseStorage;

beforeAll(() => {
  storage = new DatabaseStorage();
});

// ─────────────────────────────────────────────
// getPersonById
// ─────────────────────────────────────────────

describe("getPersonById", () => {
  let personId: number;

  beforeAll(() => {
    // Find a known person from autocomplete
    const people = storage.autocompletePeople("Nolan", 1);
    if (people.length > 0) {
      personId = people[0].id;
    } else {
      // Fallback: get first person from any movie cast
      const movie = storage.searchContent({ type: "movie", per_page: 1 });
      if (movie.results.length > 0) {
        const detail = storage.getMovieById(movie.results[0].id);
        if (detail && detail.cast.length > 0) {
          personId = detail.cast[0].person_id;
        }
      }
    }
  });

  it("should return person detail with filmography", () => {
    expect(personId).toBeDefined();
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    expect(person!.id).toBe(personId);
    expect(person!.name).toBeTruthy();
    expect(person!.tmdb_id).toBeGreaterThan(0);
  });

  it("should include known_for_department", () => {
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    expect(person!).toHaveProperty("known_for_department");
  });

  it("should include profile_path", () => {
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    expect(person!).toHaveProperty("profile_path");
  });

  it("should include movie_credits array", () => {
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    expect(Array.isArray(person!.movie_credits)).toBe(true);
  });

  it("should include tv_credits array", () => {
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    expect(Array.isArray(person!.tv_credits)).toBe(true);
  });

  it("movie credits should have correct shape", () => {
    const person = storage.getPersonById(personId);
    expect(person).toBeDefined();
    // Find any person with movie credits
    if (person!.movie_credits.length > 0) {
      const credit = person!.movie_credits[0];
      expect(credit).toHaveProperty("movie_id");
      expect(credit).toHaveProperty("tmdb_id");
      expect(credit).toHaveProperty("title");
      expect(credit).toHaveProperty("role");
      expect(["cast", "crew"]).toContain(credit.role);
    }
  });

  it("should return undefined for non-existent person ID", () => {
    const person = storage.getPersonById(999999);
    expect(person).toBeUndefined();
  });

  it("should return undefined for zero ID", () => {
    const person = storage.getPersonById(0);
    expect(person).toBeUndefined();
  });

  it("should return undefined for negative ID", () => {
    const person = storage.getPersonById(-1);
    expect(person).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// getPersonById — actor with known credits
// ─────────────────────────────────────────────

describe("getPersonById — actor with movie credits", () => {
  let actorId: number;

  beforeAll(() => {
    // Find an actor from a known movie's cast
    const result = storage.searchContent({ type: "movie", per_page: 1 });
    if (result.results.length > 0) {
      const movie = storage.getMovieById(result.results[0].id);
      if (movie && movie.cast.length > 0) {
        actorId = movie.cast[0].person_id;
      }
    }
  });

  it("actor should have at least one movie credit", () => {
    expect(actorId).toBeDefined();
    const person = storage.getPersonById(actorId);
    expect(person).toBeDefined();
    expect(person!.movie_credits.length).toBeGreaterThan(0);
  });

  it("cast movie credits should have role='cast'", () => {
    const person = storage.getPersonById(actorId);
    expect(person).toBeDefined();
    const castCredits = person!.movie_credits.filter(c => c.role === "cast");
    expect(castCredits.length).toBeGreaterThan(0);
    for (const c of castCredits) {
      expect(c.role).toBe("cast");
    }
  });
});

// ─────────────────────────────────────────────
// getRecent
// ─────────────────────────────────────────────

describe("getRecent", () => {
  it("should return an array for movies", () => {
    const results = storage.getRecent("movie", 10);
    expect(Array.isArray(results)).toBe(true);
  });

  it("should return an array for TV series", () => {
    const results = storage.getRecent("tv", 10);
    expect(Array.isArray(results)).toBe(true);
  });

  it("recent movies should be type=movie", () => {
    const results = storage.getRecent("movie", 10);
    for (const r of results) {
      expect(r.type).toBe("movie");
    }
  });

  it("recent TV should be type=tv", () => {
    const results = storage.getRecent("tv", 10);
    for (const r of results) {
      expect(r.type).toBe("tv");
    }
  });

  it("should respect the limit parameter", () => {
    const results = storage.getRecent("movie", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("recent movies should have release_date within last 3 months or be empty", () => {
    const results = storage.getRecent("movie", 10);
    if (results.length > 0) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoff = threeMonthsAgo.toISOString().slice(0, 10);
      for (const r of results) {
        if (r.release_date) {
          expect(r.release_date >= cutoff).toBe(true);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────
// getUpcoming
// ─────────────────────────────────────────────

describe("getUpcoming", () => {
  it("should return an array for movies", () => {
    const results = storage.getUpcoming("movie", 10);
    expect(Array.isArray(results)).toBe(true);
  });

  it("should return an array for TV series", () => {
    const results = storage.getUpcoming("tv", 10);
    expect(Array.isArray(results)).toBe(true);
  });

  it("upcoming movies should be type=movie", () => {
    const results = storage.getUpcoming("movie", 10);
    for (const r of results) {
      expect(r.type).toBe("movie");
    }
  });

  it("upcoming TV should be type=tv", () => {
    const results = storage.getUpcoming("tv", 10);
    for (const r of results) {
      expect(r.type).toBe("tv");
    }
  });

  it("should respect the limit parameter", () => {
    const results = storage.getUpcoming("movie", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("upcoming movies should have future release_date or production status", () => {
    const results = storage.getUpcoming("movie", 20);
    const today = new Date().toISOString().slice(0, 10);
    for (const r of results) {
      const isFuture = r.release_date && r.release_date > today;
      const isProduction = r.status === "Post Production" || r.status === "In Production";
      expect(isFuture || isProduction).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────
// Search: status filter
// ─────────────────────────────────────────────

describe("searchContent: status filter", () => {
  it("status=Released should filter to released movies", () => {
    const result = storage.searchContent({ type: "movie", status: "Released" });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.status).toBe("Released");
    }
  });

  it("status filter with non-existent status returns empty", () => {
    const result = storage.searchContent({ type: "movie", status: "NonExistentStatus" });
    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it("status filter combined with type=tv should work", () => {
    // TV shows have statuses like "Returning Series", "Ended", etc.
    const allTv = storage.searchContent({ type: "tv", per_page: 100 });
    if (allTv.results.length > 0) {
      const tvStatus = allTv.results[0].status;
      if (tvStatus) {
        const filtered = storage.searchContent({ type: "tv", status: tvStatus });
        expect(filtered.results.length).toBeGreaterThan(0);
        for (const r of filtered.results) {
          expect(r.status).toBe(tvStatus);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────
// Search: language filter
// ─────────────────────────────────────────────

describe("searchContent: language filter", () => {
  it("language=en should filter to English-language content", () => {
    const result = storage.searchContent({ type: "movie", language: "en" });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.original_language).toBe("en");
    }
  });

  it("language=ja should filter to Japanese-language content (if any)", () => {
    const result = storage.searchContent({ type: "movie", language: "ja" });
    // May or may not have Japanese movies in seed data
    for (const r of result.results) {
      expect(r.original_language).toBe("ja");
    }
  });

  it("language filter with non-existent language returns empty", () => {
    const result = storage.searchContent({ type: "movie", language: "zzz_nonexistent" });
    expect(result.results.length).toBe(0);
  });

  it("language filter combined with type=both should work", () => {
    const result = storage.searchContent({ type: "both", language: "en", per_page: 50 });
    for (const r of result.results) {
      expect(r.original_language).toBe("en");
    }
  });
});

// ─────────────────────────────────────────────
// Search: min_votes filter
// ─────────────────────────────────────────────

describe("searchContent: min_votes filter", () => {
  it("min_votes=100 should filter by vote count", () => {
    const result = storage.searchContent({ type: "movie", min_votes: 100 });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.vote_count).toBeGreaterThanOrEqual(100);
    }
  });

  it("min_votes=0 should include all movies", () => {
    const allMovies = storage.searchContent({ type: "movie", per_page: 1 });
    const withMinVotes = storage.searchContent({ type: "movie", min_votes: 0, per_page: 1 });
    expect(withMinVotes.total).toBe(allMovies.total);
  });

  it("very high min_votes should return few or no results", () => {
    const result = storage.searchContent({ type: "movie", min_votes: 999999 });
    expect(result.total).toBe(0);
  });

  it("min_votes combined with rating_min", () => {
    const result = storage.searchContent({ type: "movie", min_votes: 50, rating_min: 7.0 });
    for (const r of result.results) {
      expect(r.vote_count).toBeGreaterThanOrEqual(50);
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(7.0);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Search: keyword_id filter
// ─────────────────────────────────────────────

describe("searchContent: keyword_id filter", () => {
  let keywordId: number;

  beforeAll(() => {
    const keywords = storage.autocompleteKeywords("space", 1);
    if (keywords.length > 0) {
      keywordId = keywords[0].id;
    }
  });

  it("keyword_id filter should narrow results", () => {
    if (!keywordId) return;
    const result = storage.searchContent({ type: "movie", keyword_id: keywordId });
    expect(result.results.length).toBeGreaterThan(0);
    // All results should be movies associated with this keyword
    for (const r of result.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("non-existent keyword_id should return empty", () => {
    const result = storage.searchContent({ type: "movie", keyword_id: 999999 });
    expect(result.total).toBe(0);
  });

  it("keyword_id filter for TV should return empty (no TV keyword junction)", () => {
    if (!keywordId) return;
    const result = storage.searchContent({ type: "tv", keyword_id: keywordId });
    expect(result.total).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search: cast_id filter
// ─────────────────────────────────────────────

describe("searchContent: cast_id filter", () => {
  let castPersonId: number;

  beforeAll(() => {
    // Find a cast member from a known movie
    const result = storage.searchContent({ type: "movie", per_page: 1, sort_by: "popularity" });
    if (result.results.length > 0) {
      const movie = storage.getMovieById(result.results[0].id);
      if (movie && movie.cast.length > 0) {
        castPersonId = movie.cast[0].person_id;
      }
    }
  });

  it("cast_id filter should return movies with that cast member", () => {
    expect(castPersonId).toBeDefined();
    const result = storage.searchContent({ type: "movie", cast_id: castPersonId });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("non-existent cast_id should return empty", () => {
    const result = storage.searchContent({ type: "movie", cast_id: 999999 });
    expect(result.total).toBe(0);
  });

  it("cast_id filter with type=both should search across movies and TV", () => {
    expect(castPersonId).toBeDefined();
    const result = storage.searchContent({ type: "both", cast_id: castPersonId });
    // Should return at least the movies we know about
    expect(result.total).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Search: crew_id filter
// ─────────────────────────────────────────────

describe("searchContent: crew_id filter", () => {
  let crewPersonId: number;

  beforeAll(() => {
    // Find a crew member (director) from a known movie
    const result = storage.searchContent({ type: "movie", per_page: 1, sort_by: "popularity" });
    if (result.results.length > 0) {
      const movie = storage.getMovieById(result.results[0].id);
      if (movie && movie.crew.length > 0) {
        crewPersonId = movie.crew[0].person_id;
      }
    }
  });

  it("crew_id filter should return movies with that crew member", () => {
    expect(crewPersonId).toBeDefined();
    const result = storage.searchContent({ type: "movie", crew_id: crewPersonId });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("non-existent crew_id should return empty", () => {
    const result = storage.searchContent({ type: "movie", crew_id: 999999 });
    expect(result.total).toBe(0);
  });

  it("crew_id filter with type=both should search across movies and TV", () => {
    expect(crewPersonId).toBeDefined();
    const result = storage.searchContent({ type: "both", crew_id: crewPersonId });
    expect(result.total).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Search: sort order variations
// ─────────────────────────────────────────────

describe("searchContent: sort order variations", () => {
  it("sort_by=popularity sort_order=asc should sort ascending", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "popularity", sort_order: "asc", per_page: 20 });
    const popularities = result.results.map(r => r.popularity ?? 0).filter(p => p > 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeGreaterThanOrEqual(popularities[i - 1]);
    }
  });

  it("sort_by=title sort_order=desc should reverse alphabetical", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "title", sort_order: "desc", per_page: 20 });
    const titles = result.results.map(r => r.title.toLowerCase());
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i] <= titles[i - 1]).toBe(true);
    }
  });

  it("sort_by=release_date sort_order=desc should sort newest first", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "release_date", sort_order: "desc", per_page: 20 });
    const dates = result.results.map(r => r.release_date ?? "").filter(d => d !== "");
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  it("sort_by=release_date sort_order=asc should sort oldest first", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "release_date", sort_order: "asc", per_page: 20 });
    const dates = result.results.map(r => r.release_date ?? "").filter(d => d !== "");
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  it("sort_by=vote_average sort_order=asc should sort lowest first", () => {
    const result = storage.searchContent({ type: "movie", sort_by: "vote_average", sort_order: "asc", per_page: 20 });
    const ratings = result.results.map(r => r.vote_average ?? 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i - 1] - 0.001);
    }
  });
});

// ─────────────────────────────────────────────
// Search: pagination edge cases
// ─────────────────────────────────────────────

describe("searchContent: pagination edge cases", () => {
  it("page beyond total results should return empty results", () => {
    const result = storage.searchContent({ type: "movie", page: 9999, per_page: 20 });
    expect(result.results.length).toBe(0);
    expect(result.page).toBe(9999);
    expect(result.total).toBeGreaterThan(0);
  });

  it("page=0 should be treated as page=1", () => {
    const result = storage.searchContent({ type: "movie", page: 0, per_page: 5 });
    expect(result.page).toBe(1);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("negative page should be treated as page=1", () => {
    const result = storage.searchContent({ type: "movie", page: -5, per_page: 5 });
    expect(result.page).toBe(1);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("per_page=0 should be treated as per_page=1 (minimum)", () => {
    const result = storage.searchContent({ type: "movie", per_page: 0 });
    expect(result.per_page).toBe(1);
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it("per_page over 100 should be clamped to 100", () => {
    const result = storage.searchContent({ type: "movie", per_page: 200 });
    expect(result.per_page).toBe(100);
    expect(result.results.length).toBeLessThanOrEqual(100);
  });

  it("total_pages calculation should be correct", () => {
    const result = storage.searchContent({ type: "movie", per_page: 5 });
    expect(result.total_pages).toBe(Math.ceil(result.total / 5));
  });
});

// ─────────────────────────────────────────────
// Search: combined complex filters (3+ at once)
// ─────────────────────────────────────────────

describe("searchContent: complex combined filters", () => {
  it("type + language + rating_min + year_min combined", () => {
    const result = storage.searchContent({
      type: "movie",
      language: "en",
      rating_min: 6.0,
      year_min: 2000,
    });
    for (const r of result.results) {
      expect(r.type).toBe("movie");
      expect(r.original_language).toBe("en");
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(6.0);
      }
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2000);
      }
    }
  });

  it("status + language + min_votes combined", () => {
    const result = storage.searchContent({
      type: "movie",
      status: "Released",
      language: "en",
      min_votes: 50,
    });
    for (const r of result.results) {
      expect(r.status).toBe("Released");
      expect(r.original_language).toBe("en");
      expect(r.vote_count).toBeGreaterThanOrEqual(50);
    }
  });

  it("text query + type + rating combined", () => {
    const result = storage.searchContent({
      query: "space",
      type: "movie",
      rating_min: 5.0,
    });
    for (const r of result.results) {
      expect(r.type).toBe("movie");
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(5.0);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Autocomplete edge cases
// ─────────────────────────────────────────────

describe("autocompletePeople: edge cases", () => {
  it("single character search should work", () => {
    const results = storage.autocompletePeople("a", 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("special characters should not crash", () => {
    expect(() => storage.autocompletePeople("'", 5)).not.toThrow();
    expect(() => storage.autocompletePeople("%", 5)).not.toThrow();
    expect(() => storage.autocompletePeople("_", 5)).not.toThrow();
  });
});

describe("autocompleteKeywords: edge cases", () => {
  it("single character search should work", () => {
    const results = storage.autocompleteKeywords("s", 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("special characters should not crash", () => {
    expect(() => storage.autocompleteKeywords("'", 5)).not.toThrow();
    expect(() => storage.autocompleteKeywords("%", 5)).not.toThrow();
  });
});
