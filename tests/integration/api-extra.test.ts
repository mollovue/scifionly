/**
 * Additional API integration tests using Supertest.
 *
 * Covers: GET /api/people/:id, GET /api/movies/recent, GET /api/movies/upcoming,
 * GET /api/tv/trending, GET /api/tv/top-rated, search with status/language/min_votes/
 * keyword/cast/crew filters, sort order, and edge cases.
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
// GET /api/people/:id
// ─────────────────────────────────────────────

describe("GET /api/people/:id", () => {
  let personId: number;

  beforeAll(async () => {
    // Find a person via autocomplete
    const res = await request(app).get("/api/autocomplete/people?q=chris");
    if (res.body.results.length > 0) {
      personId = res.body.results[0].id;
    }
  });

  it("should return 200 with person details", async () => {
    expect(personId).toBeDefined();
    const res = await request(app).get(`/api/people/${personId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", personId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("tmdb_id");
  });

  it("should include movie_credits array", async () => {
    const res = await request(app).get(`/api/people/${personId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.movie_credits)).toBe(true);
  });

  it("should include tv_credits array", async () => {
    const res = await request(app).get(`/api/people/${personId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tv_credits)).toBe(true);
  });

  it("should include known_for_department", async () => {
    const res = await request(app).get(`/api/people/${personId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("known_for_department");
  });

  it("should include profile_path", async () => {
    const res = await request(app).get(`/api/people/${personId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("profile_path");
  });

  it("should return 404 for nonexistent person ID", async () => {
    const res = await request(app).get("/api/people/999999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid (non-numeric) person ID", async () => {
    const res = await request(app).get("/api/people/not-a-number");
    expect(res.status).toBe(400);
  });

  it("movie credits should have correct shape", async () => {
    const res = await request(app).get(`/api/people/${personId}`);
    if (res.body.movie_credits.length > 0) {
      const credit = res.body.movie_credits[0];
      expect(credit).toHaveProperty("movie_id");
      expect(credit).toHaveProperty("tmdb_id");
      expect(credit).toHaveProperty("title");
      expect(credit).toHaveProperty("role");
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/movies/recent
// ─────────────────────────────────────────────

describe("GET /api/movies/recent", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/movies/recent");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("should return only movies", async () => {
    const res = await request(app).get("/api/movies/recent");
    for (const r of res.body.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("?limit=3 should return at most 3 results", async () => {
    const res = await request(app).get("/api/movies/recent?limit=3");
    expect(res.body.results.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────
// GET /api/movies/upcoming
// ─────────────────────────────────────────────

describe("GET /api/movies/upcoming", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/movies/upcoming");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("should return only movies", async () => {
    const res = await request(app).get("/api/movies/upcoming");
    for (const r of res.body.results) {
      expect(r.type).toBe("movie");
    }
  });

  it("?limit=5 should return at most 5 results", async () => {
    const res = await request(app).get("/api/movies/upcoming?limit=5");
    expect(res.body.results.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// GET /api/tv/trending
// ─────────────────────────────────────────────

describe("GET /api/tv/trending", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/tv/trending");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("should return only TV series", async () => {
    const res = await request(app).get("/api/tv/trending");
    for (const r of res.body.results) {
      expect(r.type).toBe("tv");
    }
  });

  it("should be sorted by popularity descending", async () => {
    const res = await request(app).get("/api/tv/trending?limit=20");
    const popularities = res.body.results.map((r: { popularity: number }) => r.popularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  it("?limit=3 should return at most 3 results", async () => {
    const res = await request(app).get("/api/tv/trending?limit=3");
    expect(res.body.results.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────
// GET /api/tv/top-rated
// ─────────────────────────────────────────────

describe("GET /api/tv/top-rated", () => {
  it("should return 200 with results array", async () => {
    const res = await request(app).get("/api/tv/top-rated");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("should return only TV series", async () => {
    const res = await request(app).get("/api/tv/top-rated");
    for (const r of res.body.results) {
      expect(r.type).toBe("tv");
    }
  });

  it("should be sorted by rating descending", async () => {
    const res = await request(app).get("/api/tv/top-rated?limit=10");
    const ratings = res.body.results.map((r: { vote_average: number }) => r.vote_average ?? 0);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1] + 0.001);
    }
  });

  it("?limit=5 should return at most 5 results", async () => {
    const res = await request(app).get("/api/tv/top-rated?limit=5");
    expect(res.body.results.length).toBeLessThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────
// Search with status filter
// ─────────────────────────────────────────────

describe("GET /api/search with status filter", () => {
  it("?status=Released should filter to released movies", async () => {
    const res = await request(app).get("/api/search?type=movie&status=Released");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      expect(r.status).toBe("Released");
    }
  });

  it("?status=NonExistent should return empty", async () => {
    const res = await request(app).get("/api/search?type=movie&status=NonExistent");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search with language filter
// ─────────────────────────────────────────────

describe("GET /api/search with language filter", () => {
  it("?language=en should filter to English content", async () => {
    const res = await request(app).get("/api/search?type=movie&language=en");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      expect(r.original_language).toBe("en");
    }
  });

  it("?language=zzz should return empty for non-existent language", async () => {
    const res = await request(app).get("/api/search?type=movie&language=zzz_nonexistent");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search with min_votes filter
// ─────────────────────────────────────────────

describe("GET /api/search with min_votes filter", () => {
  it("?min_votes=100 should filter by vote count", async () => {
    const res = await request(app).get("/api/search?type=movie&min_votes=100");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    for (const r of res.body.results) {
      expect(r.vote_count).toBeGreaterThanOrEqual(100);
    }
  });

  it("?min_votes=999999 should return empty", async () => {
    const res = await request(app).get("/api/search?type=movie&min_votes=999999");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search with keyword filter
// ─────────────────────────────────────────────

describe("GET /api/search with keyword filter", () => {
  let keywordId: number;

  beforeAll(async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=space");
    if (res.body.results.length > 0) {
      keywordId = res.body.results[0].id;
    }
  });

  it("?keyword=id should filter by keyword", async () => {
    if (!keywordId) return;
    const res = await request(app).get(`/api/search?type=movie&keyword=${keywordId}`);
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("?keyword=999999 should return empty", async () => {
    const res = await request(app).get("/api/search?type=movie&keyword=999999");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search with cast_id filter
// ─────────────────────────────────────────────

describe("GET /api/search with cast filter", () => {
  let castId: number;

  beforeAll(async () => {
    // Find a cast member
    const searchRes = await request(app).get("/api/search?type=movie&per_page=1");
    if (searchRes.body.results.length > 0) {
      const movieRes = await request(app).get(`/api/movies/${searchRes.body.results[0].id}`);
      if (movieRes.body.cast && movieRes.body.cast.length > 0) {
        castId = movieRes.body.cast[0].person_id;
      }
    }
  });

  it("?cast=id should filter by cast member", async () => {
    expect(castId).toBeDefined();
    const res = await request(app).get(`/api/search?type=movie&cast=${castId}`);
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("?cast=999999 should return empty", async () => {
    const res = await request(app).get("/api/search?type=movie&cast=999999");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search with crew_id filter
// ─────────────────────────────────────────────

describe("GET /api/search with crew filter", () => {
  let crewId: number;

  beforeAll(async () => {
    const searchRes = await request(app).get("/api/search?type=movie&per_page=1");
    if (searchRes.body.results.length > 0) {
      const movieRes = await request(app).get(`/api/movies/${searchRes.body.results[0].id}`);
      if (movieRes.body.crew && movieRes.body.crew.length > 0) {
        crewId = movieRes.body.crew[0].person_id;
      }
    }
  });

  it("?crew=id should filter by crew member", async () => {
    expect(crewId).toBeDefined();
    const res = await request(app).get(`/api/search?type=movie&crew=${crewId}`);
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("?crew=999999 should return empty", async () => {
    const res = await request(app).get("/api/search?type=movie&crew=999999");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Search sort order parameter
// ─────────────────────────────────────────────

describe("GET /api/search with sort_order", () => {
  it("?sort_by=popularity&sort_order=asc should sort ascending", async () => {
    const res = await request(app).get("/api/search?type=movie&sort_by=popularity&sort_order=asc&per_page=10");
    expect(res.status).toBe(200);
    const popularities = res.body.results.map((r: { popularity: number }) => r.popularity ?? 0).filter((p: number) => p > 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeGreaterThanOrEqual(popularities[i - 1]);
    }
  });

  it("?sort_by=release_date&sort_order=desc should sort newest first", async () => {
    const res = await request(app).get("/api/search?type=movie&sort_by=release_date&sort_order=desc&per_page=10");
    expect(res.status).toBe(200);
    const dates = res.body.results.map((r: { release_date: string }) => r.release_date ?? "").filter((d: string) => d !== "");
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  it("?sort_by=title&sort_order=asc should sort alphabetically", async () => {
    const res = await request(app).get("/api/search?type=movie&sort_by=title&sort_order=asc&per_page=10");
    expect(res.status).toBe(200);
    const titles = res.body.results.map((r: { title: string }) => r.title.toLowerCase());
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i] >= titles[i - 1]).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────
// Additional edge cases
// ─────────────────────────────────────────────

describe("Additional edge cases", () => {
  it("GET /api/search with combined status + language + min_votes", async () => {
    const res = await request(app).get("/api/search?type=movie&status=Released&language=en&min_votes=50");
    expect(res.status).toBe(200);
    for (const r of res.body.results) {
      expect(r.status).toBe("Released");
      expect(r.original_language).toBe("en");
      expect(r.vote_count).toBeGreaterThanOrEqual(50);
    }
  });

  it("GET /api/search pagination: page=1 and page=2 should not overlap", async () => {
    const page1 = await request(app).get("/api/search?type=movie&per_page=5&page=1");
    const page2 = await request(app).get("/api/search?type=movie&per_page=5&page=2");
    const ids1 = new Set(page1.body.results.map((r: { id: number }) => r.id));
    const ids2 = new Set(page2.body.results.map((r: { id: number }) => r.id));
    const overlap = [...ids1].filter(id => ids2.has(id));
    expect(overlap.length).toBe(0);
  });

  it("GET /api/search with per_page=1 should return exactly 1 result", async () => {
    const res = await request(app).get("/api/search?type=movie&per_page=1");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBe(1);
    expect(res.body.per_page).toBe(1);
  });

  it("GET /api/autocomplete/people with single char should work", async () => {
    const res = await request(app).get("/api/autocomplete/people?q=a");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("GET /api/autocomplete/keywords with single char should work", async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=s");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it("GET /api/autocomplete/people with limit param", async () => {
    const res = await request(app).get("/api/autocomplete/people?q=a&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(2);
  });

  it("GET /api/autocomplete/keywords with limit param", async () => {
    const res = await request(app).get("/api/autocomplete/keywords?q=s&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(2);
  });

  it("GET /api/movies/trending with very large limit should be capped at 100", async () => {
    const res = await request(app).get("/api/movies/trending?limit=500");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(100);
  });

  it("GET /api/tv/trending with very large limit should be capped at 100", async () => {
    const res = await request(app).get("/api/tv/trending?limit=500");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(100);
  });
});
