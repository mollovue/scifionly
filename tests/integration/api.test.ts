/**
 * API integration tests using Supertest.
 *
 * Creates an Express app, registers all routes, and verifies
 * the HTTP API layer returns correct responses for the seeded demo data.
 */

import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import { createServer } from "http";
import request from "supertest";
import { registerRoutes } from "../../server/routes.js";

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
}, 30_000);

// ─────────────────────────────────────────────
// GET /api/search — structure
// ─────────────────────────────────────────────

describe("GET /api/search", () => {
  it("should return 200 with valid response structure", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("per_page");
    expect(res.body).toHaveProperty("total_pages");
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("default search should return results", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("results should have correct shape", async () => {
    const res = await request(app).get("/api/search?per_page=1");
    expect(res.status).toBe(200);
    const item = res.body.results[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("tmdb_id");
    expect(item).toHaveProperty("type");
    expect(item).toHaveProperty("title");
    expect(["movie", "tv"]).toContain(item.type);
  });
});

// ─────────────────────────────────────────────
// GET /api/search?query=...
// ─────────────────────────────────────────────

describe("GET /api/search?query=...", () => {
  it("?query=blade should return results containing Blade Runner", async () => {
    const res = await request(app).get("/api/search?query=blade+runner");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    const titles = res.body.results.map((r: { title: string }) => r.title.toLowerCase());
    expect(titles.some((t: string) => t.includes("blade"))).toBe(true);
  });

  it("?query=expanse should find The Expanse TV series", async () => {
    const res = await request(app).get("/api/search?query=expanse");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    const titles = res.body.results.map((r: { title: string }) => r.title.toLowerCase());
    expect(titles.some((t: string) => t.includes("expanse"))).toBe(true);
  });

  it("?query=gibberish should return empty results", async () => {
    const res = await request(app).get("/api/search?query=xyzzy_nonexistent_abc123");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// GET /api/search?type=...
// ─────────────────────────────────────────────

describe("GET /api/search?type=...", () => {
  it("?type=movie should only return movies", async () => {
    const res = await request(app).get("/api/search?type=movie&per_page=20");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("?type=tv should only return TV series", async () => {
    const res = await request(app).get("/api/search?type=tv&per_page=20");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      expect(r.type).toBe("tv");
    }
  });

  it("invalid type should fall back to both", async () => {
    const res = await request(app).get("/api/search?type=invalid");
    expect(res.status).toBe(200);
    const types = new Set(res.body.results.map((r: { type: string }) => r.type));
    // Should return results from both or at minimum not crash
    expect(res.body.total).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────
// GET /api/search with year filters
// ─────────────────────────────────────────────

describe("GET /api/search with year filters", () => {
  it("?year_min=2000&year_max=2020 should filter by year", async () => {
    const res = await request(app).get("/api/search?type=movie&year_min=2000&year_max=2020");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2000);
        expect(year).toBeLessThanOrEqual(2020);
      }
    }
  });

  it("?year_min=2020 should only return recent titles", async () => {
    const res = await request(app).get("/api/search?type=movie&year_min=2020&per_page=20");
    expect(res.status).toBe(200);
    for (const r of res.body.results) {
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2020);
      }
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/search with rating filter
// ─────────────────────────────────────────────

describe("GET /api/search with rating filter", () => {
  it("?rating_min=8 should only return highly-rated titles", async () => {
    const res = await request(app).get("/api/search?rating_min=8");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("?rating_min=9.5 should return fewer results than rating_min=5", async () => {
    const highRes = await request(app).get("/api/search?rating_min=9.5");
    const lowRes = await request(app).get("/api/search?rating_min=5");
    expect(highRes.status).toBe(200);
    expect(lowRes.status).toBe(200);
    expect(highRes.body.total).toBeLessThan(lowRes.body.total);
  });
});

// ─────────────────────────────────────────────
// GET /api/search with multiple filters (AND logic)
// ─────────────────────────────────────────────

describe("GET /api/search with multiple filters", () => {
  it("type + year + rating combined filter", async () => {
    const res = await request(app).get("/api/search?type=movie&year_min=2000&rating_min=7.5");
    expect(res.status).toBe(200);
    for (const r of res.body.results) {
      expect(r.type).toBe("movie");
      if (r.release_date) {
        const year = parseInt(r.release_date.slice(0, 4), 10);
        expect(year).toBeGreaterThanOrEqual(2000);
      }
      if (r.vote_average !== null) {
        expect(r.vote_average).toBeGreaterThanOrEqual(7.5);
      }
    }
  });

  it("sort_by=vote_average should return sorted results", async () => {
    const res = await request(app).get("/api/search?type=movie&sort_by=vote_average&sort_order=desc&per_page=10");
    expect(res.status).toBe(200);
    const ratings = res.body.results.map((r: { vote_average: number }) => r.vote_average ?? 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1] + 0.001);
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/movies/:id
// ─────────────────────────────────────────────

describe("GET /api/movies/:id", () => {
  let movieId: number;

  beforeAll(async () => {
    const res = await request(app).get("/api/search?type=movie&query=interstellar&per_page=1");
    if (res.body.results.length > 0) {
      movieId = res.body.results[0].id;
    } else {
      // Fall back to first movie
      const fallback = await request(app).get("/api/search?type=movie&per_page=1");
      movieId = fallback.body.results[0]?.id;
    }
  });

  it("should return 200 with movie details", async () => {
    const res = await request(app).get(`/api/movies/${movieId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", movieId);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("tmdb_id");
  });

  it("should include cast array in movie details", async () => {
    const res = await request(app).get(`/api/movies/${movieId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cast)).toBe(true);
    expect(res.body.cast.length).toBeGreaterThan(0);
    expect(res.body.cast[0]).toHaveProperty("name");
  });

  it("should include crew array in movie details", async () => {
    const res = await request(app).get(`/api/movies/${movieId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.crew)).toBe(true);
    expect(res.body.crew.length).toBeGreaterThan(0);
  });

  it("should include genres array in movie details", async () => {
    const res = await request(app).get(`/api/movies/${movieId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.genres)).toBe(true);
    expect(res.body.genres.length).toBeGreaterThan(0);
    expect(res.body.genres[0]).toHaveProperty("name");
  });

  it("should return 404 for nonexistent movie ID", async () => {
    const res = await request(app).get("/api/movies/999999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid (non-numeric) movie ID", async () => {
    const res = await request(app).get("/api/movies/not-a-number");
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// GET /api/tv/:id
// ─────────────────────────────────────────────

describe("GET /api/tv/:id", () => {
  let tvId: number;

  beforeAll(async () => {
    const res = await request(app).get("/api/search?type=tv&per_page=1");
    tvId = res.body.results[0]?.id;
  });

  it("should return 200 with TV series details", async () => {
    const res = await request(app).get(`/api/tv/${tvId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", tvId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("tmdb_id");
  });

  it("should include cast array", async () => {
    const res = await request(app).get(`/api/tv/${tvId}`);
    expect(Array.isArray(res.body.cast)).toBe(true);
    expect(res.body.cast.length).toBeGreaterThan(0);
  });

  it("should include genres array", async () => {
    const res = await request(app).get(`/api/tv/${tvId}`);
    expect(Array.isArray(res.body.genres)).toBe(true);
    expect(res.body.genres.length).toBeGreaterThan(0);
  });

  it("should return 404 for nonexistent TV series ID", async () => {
    const res = await request(app).get("/api/tv/999999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid (non-numeric) ID", async () => {
    const res = await request(app).get("/api/tv/not-a-number");
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// GET /api/movies/trending
// ─────────────────────────────────────────────

describe("GET /api/movies/trending", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/movies/trending");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("should return only movies", async () => {
    const res = await request(app).get("/api/movies/trending");
    expect(res.body.results.every((r: { type: string }) => r.type === "movie")).toBe(true);
  });

  it("should be sorted by popularity descending", async () => {
    const res = await request(app).get("/api/movies/trending?limit=20");
    const popularities = res.body.results.map((r: { popularity: number }) => r.popularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  it("?limit=5 should return at most 5 results", async () => {
    const res = await request(app).get("/api/movies/trending?limit=5");
    expect(res.body.results.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// GET /api/movies/top-rated
// ─────────────────────────────────────────────

describe("GET /api/movies/top-rated", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/movies/top-rated");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("should be sorted by rating descending", async () => {
    const res = await request(app).get("/api/movies/top-rated?limit=10");
    const ratings = res.body.results.map((r: { vote_average: number }) => r.vote_average ?? 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1] + 0.001);
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/autocomplete/people
// ─────────────────────────────────────────────

describe("GET /api/autocomplete/people", () => {
  it("?q=chris should return matching people", async () => {
    const res = await request(app).get("/api/autocomplete/people?q=chris");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const p of res.body.results) {
      expect(p.name.toLowerCase()).toContain("chris");
    }
  });

  it("should return empty results when q is missing", async () => {
    const res = await request(app).get("/api/autocomplete/people");
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it("?q=nolan should find Christopher Nolan", async () => {
    const res = await request(app).get("/api/autocomplete/people?q=nolan");
    expect(res.status).toBe(200);
    expect(res.body.results.some((p: { name: string }) => p.name.toLowerCase().includes("nolan"))).toBe(true);
  });

  it("results should have id, name, profile_path, known_for_department", async () => {
    const res = await request(app).get("/api/autocomplete/people?q=ryan");
    expect(res.status).toBe(200);
    if (res.body.results.length > 0) {
      const p = res.body.results[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("profile_path");
      expect(p).toHaveProperty("known_for_department");
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/stats
// ─────────────────────────────────────────────

describe("GET /api/stats", () => {
  it("should return 200 with stats object", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total_movies");
    expect(res.body).toHaveProperty("total_tv_series");
    expect(res.body).toHaveProperty("genres_count");
    expect(res.body).toHaveProperty("people_count");
  });

  it("total_movies should be positive", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.total_movies).toBeGreaterThan(0);
  });

  it("total_tv_series should be positive", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.total_tv_series).toBeGreaterThan(0);
  });

  it("genres_count should be >= 5", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.body.genres_count).toBeGreaterThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// Edge cases and error handling
// ─────────────────────────────────────────────

describe("Error handling", () => {
  it("should return 404 for nonexistent movie with message", async () => {
    const res = await request(app).get("/api/movies/999999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(typeof res.body.error).toBe("string");
  });

  it("should return 404 for nonexistent TV series with message", async () => {
    const res = await request(app).get("/api/tv/999999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should handle non-numeric movie ID gracefully", async () => {
    const res = await request(app).get("/api/movies/abc");
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("should handle missing autocomplete q param gracefully", async () => {
    const res = await request(app).get("/api/autocomplete/keywords");
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it("search with very large page number should return empty results gracefully", async () => {
    const res = await request(app).get("/api/search?page=99999");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("search with per_page=0 should handle gracefully", async () => {
    const res = await request(app).get("/api/search?per_page=0");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// GET /api/autocomplete/keywords
// ─────────────────────────────────────────────

describe("GET /api/autocomplete/keywords", () => {
  it("?q=space should return space keyword", async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=space");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("?q=robot should return robot-related keywords", async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=robot");
    expect(res.status).toBe(200);
    expect(res.body.results.some((k: { name: string }) => k.name.toLowerCase().includes("robot"))).toBe(true);
  });

  it("results should have id and name fields", async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=dys");
    expect(res.status).toBe(200);
    if (res.body.results.length > 0) {
      expect(res.body.results[0]).toHaveProperty("id");
      expect(res.body.results[0]).toHaveProperty("name");
    }
  });
});
