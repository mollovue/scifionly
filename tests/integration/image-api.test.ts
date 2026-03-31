/**
 * Integration tests for the image cache API endpoint.
 *
 * Tests GET /api/images/:mediaType/:id/:imageType
 * Covers: cache hits, cache misses, parameter validation,
 * content-type headers, and async fetch triggering.
 */

import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import express, { type Express } from "express";
import { createServer } from "http";
import request from "supertest";
import { registerRoutes } from "../../server/routes.js";
import { storage } from "../../server/storage.js";

let app: Express;
let movieId: number;
let tvId: number;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  // Find a movie and TV series from seeded data
  const movieResult = storage.searchContent({ type: "movie", per_page: 1 });
  if (movieResult.results.length > 0) {
    movieId = movieResult.results[0].id;
  }

  const tvResult = storage.searchContent({ type: "tv", per_page: 1 });
  if (tvResult.results.length > 0) {
    tvId = tvResult.results[0].id;
  }
}, 30_000);

// ─────────────────────────────────────────────
// Parameter validation
// ─────────────────────────────────────────────

describe("GET /api/images — parameter validation", () => {
  it("should return 400 for invalid mediaType", async () => {
    const res = await request(app).get("/api/images/anime/1/poster");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("mediaType");
  });

  it("should return 400 for invalid imageType", async () => {
    const res = await request(app).get("/api/images/movie/1/logo");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("imageType");
  });

  it("should return 400 for non-numeric ID", async () => {
    const res = await request(app).get("/api/images/movie/abc/poster");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("ID");
  });

  it("should accept 'movie' as a valid mediaType", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    // Should not be 400 — either 200, 202, or 404 depending on state
    expect(res.status).not.toBe(400);
  });

  it("should accept 'tv' as a valid mediaType", async () => {
    const res = await request(app).get(`/api/images/tv/${tvId}/poster`);
    expect(res.status).not.toBe(400);
  });

  it("should accept 'poster' as a valid imageType", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    expect(res.status).not.toBe(400);
  });

  it("should accept 'backdrop' as a valid imageType", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/backdrop`);
    expect(res.status).not.toBe(400);
  });
});

// ─────────────────────────────────────────────
// Cache hit — after pre-populating the cache
// ─────────────────────────────────────────────

describe("GET /api/images — cache hit", () => {
  const fakeJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, // JPEG magic bytes
    ...Array(96).fill(0x42), // padding
  ]);

  beforeAll(() => {
    // Seed the cache with known test images
    storage.cacheImage(
      "movie", movieId, "poster", "w342",
      "/test-poster.jpg", fakeJpeg, "image/jpeg", fakeJpeg.length
    );
    storage.cacheImage(
      "movie", movieId, "backdrop", "w780",
      "/test-backdrop.jpg", fakeJpeg, "image/webp", fakeJpeg.length
    );
    storage.cacheImage(
      "tv", tvId, "poster", "w342",
      "/test-tv-poster.jpg", fakeJpeg, "image/png", fakeJpeg.length
    );
  });

  it("should return 200 with cached poster image data", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Buffer);
    expect(res.body.length).toBe(fakeJpeg.length);
  });

  it("should set Content-Type header from cached content_type", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
  });

  it("should set Cache-Control header for cache hit", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
    expect(res.headers["cache-control"]).toContain("max-age=86400");
  });

  it("should set Content-Length header", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    expect(res.status).toBe(200);
    expect(res.headers["content-length"]).toBe(String(fakeJpeg.length));
  });

  it("should return correct content-type for webp backdrop", async () => {
    const res = await request(app).get(`/api/images/movie/${movieId}/backdrop`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/webp");
  });

  it("should return cached TV series poster", async () => {
    const res = await request(app).get(`/api/images/tv/${tvId}/poster`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
  });

  it("should accept custom size query parameter for cached image", async () => {
    // Pre-populate a custom size
    storage.cacheImage(
      "movie", movieId, "poster", "w500",
      "/test-poster.jpg", fakeJpeg, "image/jpeg", fakeJpeg.length
    );
    const res = await request(app).get(`/api/images/movie/${movieId}/poster?size=w500`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// Cache miss — 202 or 404 responses
// ─────────────────────────────────────────────

describe("GET /api/images — cache miss", () => {
  it("should return 202 for uncached image when TMDB path exists", async () => {
    // Use a fresh movie ID that has a poster_path but no cached image
    const searchResult = storage.searchContent({ type: "movie", per_page: 10 });
    let uncachedMovieId: number | null = null;

    for (const movie of searchResult.results) {
      const posterPath = storage.getTmdbImagePath("movie", movie.id, "poster");
      if (posterPath) {
        // Check if NOT in cache at a unique size to ensure cache miss
        const cached = storage.getCachedImage("movie", movie.id, "poster", "w185");
        if (!cached) {
          uncachedMovieId = movie.id;
          break;
        }
      }
    }

    if (uncachedMovieId) {
      const res = await request(app).get(`/api/images/movie/${uncachedMovieId}/poster?size=w185`);
      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty("status", "fetching");
    }
  });

  it("should return 404 when no TMDB image path exists", async () => {
    // Use a non-existent ID (no movie/tv entry in DB)
    const res = await request(app).get("/api/images/movie/999999/poster");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("No image path");
  });

  it("should return 404 for nonexistent TV series image", async () => {
    const res = await request(app).get("/api/images/tv/999999/backdrop");
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// Default size behavior
// ─────────────────────────────────────────────

describe("GET /api/images — default size", () => {
  it("poster default size should be w342", async () => {
    // Pre-populate with w342 (default poster size)
    const testData = Buffer.from("w342-poster-default-size-test");
    storage.cacheImage(
      "movie", movieId, "poster", "w342",
      "/default.jpg", testData, "image/jpeg", testData.length
    );
    const res = await request(app).get(`/api/images/movie/${movieId}/poster`);
    // No ?size param → should use w342 → find our cached image
    expect(res.status).toBe(200);
  });

  it("backdrop default size should be w780", async () => {
    const testData = Buffer.from("w780-backdrop-default-size-test");
    storage.cacheImage(
      "movie", movieId, "backdrop", "w780",
      "/default-backdrop.jpg", testData, "image/webp", testData.length
    );
    const res = await request(app).get(`/api/images/movie/${movieId}/backdrop`);
    // No ?size param → should use w780
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────

describe("GET /api/images — edge cases", () => {
  it("should handle very large ID numbers", async () => {
    const res = await request(app).get("/api/images/movie/2147483647/poster");
    // Should not crash — either 404 (no path) or 202
    expect([404, 202]).toContain(res.status);
  });

  it("should handle negative ID as valid integer", async () => {
    const res = await request(app).get("/api/images/movie/-1/poster");
    // Negative ID is parseable but won't match — should get 404
    expect(res.status).toBe(404);
  });

  it("should handle float-like ID", async () => {
    // parseInt("3.14") → 3, which may exist
    const res = await request(app).get("/api/images/movie/3.14/poster");
    // Should parse to 3 — not a 400
    expect([200, 202, 404]).toContain(res.status);
  });
});
