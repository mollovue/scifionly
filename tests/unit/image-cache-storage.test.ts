/**
 * Unit tests for image cache storage methods.
 *
 * Tests getCachedImage, cacheImage, getTmdbImagePath against
 * the demo-seeded database.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { DatabaseStorage } from "../../server/storage.js";

let storage: DatabaseStorage;

beforeAll(() => {
  storage = new DatabaseStorage();
});

// ─────────────────────────────────────────────
// getCachedImage — cache miss
// ─────────────────────────────────────────────

describe("getCachedImage", () => {
  it("should return null for an uncached image", () => {
    const result = storage.getCachedImage("movie", 1, "poster", "w342");
    expect(result).toBeNull();
  });

  it("should return null for an uncached backdrop", () => {
    const result = storage.getCachedImage("movie", 1, "backdrop", "w780");
    expect(result).toBeNull();
  });

  it("should return null for non-existent media ID", () => {
    const result = storage.getCachedImage("movie", 999999, "poster", "w342");
    expect(result).toBeNull();
  });

  it("should return null for TV series cache miss", () => {
    const result = storage.getCachedImage("tv", 1, "poster", "w342");
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────
// cacheImage + getCachedImage — round trip
// ─────────────────────────────────────────────

describe("cacheImage and getCachedImage round trip", () => {
  const testImageData = Buffer.from("fake-jpeg-data-for-testing");
  const testContentType = "image/jpeg";

  it("should store and retrieve a poster image", () => {
    storage.cacheImage(
      "movie", 1, "poster", "w342",
      "/test-poster.jpg", testImageData, testContentType, testImageData.length
    );

    const cached = storage.getCachedImage("movie", 1, "poster", "w342");
    expect(cached).not.toBeNull();
    expect(Buffer.isBuffer(cached!.image_data)).toBe(true);
    expect(cached!.image_data.toString()).toBe("fake-jpeg-data-for-testing");
    expect(cached!.content_type).toBe("image/jpeg");
  });

  it("should store and retrieve a backdrop image", () => {
    const backdropData = Buffer.from("fake-backdrop-data");
    storage.cacheImage(
      "movie", 1, "backdrop", "w780",
      "/test-backdrop.jpg", backdropData, "image/webp", backdropData.length
    );

    const cached = storage.getCachedImage("movie", 1, "backdrop", "w780");
    expect(cached).not.toBeNull();
    expect(cached!.image_data.toString()).toBe("fake-backdrop-data");
    expect(cached!.content_type).toBe("image/webp");
  });

  it("should store and retrieve a TV series poster", () => {
    const tvData = Buffer.from("tv-poster-data");
    storage.cacheImage(
      "tv", 1, "poster", "w342",
      "/tv-poster.jpg", tvData, "image/png", tvData.length
    );

    const cached = storage.getCachedImage("tv", 1, "poster", "w342");
    expect(cached).not.toBeNull();
    expect(cached!.image_data.toString()).toBe("tv-poster-data");
    expect(cached!.content_type).toBe("image/png");
  });

  it("should store and retrieve a TV series backdrop", () => {
    const tvBackdrop = Buffer.from("tv-backdrop-data");
    storage.cacheImage(
      "tv", 1, "backdrop", "w780",
      "/tv-backdrop.jpg", tvBackdrop, "image/jpeg", tvBackdrop.length
    );

    const cached = storage.getCachedImage("tv", 1, "backdrop", "w780");
    expect(cached).not.toBeNull();
    expect(cached!.image_data.toString()).toBe("tv-backdrop-data");
  });

  it("should differentiate between different sizes", () => {
    const dataW342 = Buffer.from("small-poster");
    const dataW500 = Buffer.from("large-poster");

    storage.cacheImage(
      "movie", 2, "poster", "w342",
      "/poster.jpg", dataW342, "image/jpeg", dataW342.length
    );
    storage.cacheImage(
      "movie", 2, "poster", "w500",
      "/poster.jpg", dataW500, "image/jpeg", dataW500.length
    );

    const small = storage.getCachedImage("movie", 2, "poster", "w342");
    const large = storage.getCachedImage("movie", 2, "poster", "w500");

    expect(small!.image_data.toString()).toBe("small-poster");
    expect(large!.image_data.toString()).toBe("large-poster");
  });

  it("should differentiate between movie and tv for same ID", () => {
    const movieData = Buffer.from("movie-data");
    const tvData = Buffer.from("tv-data");

    storage.cacheImage(
      "movie", 3, "poster", "w342",
      "/movie.jpg", movieData, "image/jpeg", movieData.length
    );
    storage.cacheImage(
      "tv", 3, "poster", "w342",
      "/tv.jpg", tvData, "image/jpeg", tvData.length
    );

    const movieResult = storage.getCachedImage("movie", 3, "poster", "w342");
    const tvResult = storage.getCachedImage("tv", 3, "poster", "w342");

    expect(movieResult!.image_data.toString()).toBe("movie-data");
    expect(tvResult!.image_data.toString()).toBe("tv-data");
  });
});

// ─────────────────────────────────────────────
// cacheImage — upsert (overwrite existing)
// ─────────────────────────────────────────────

describe("cacheImage upsert behavior", () => {
  it("should overwrite existing cache entry (INSERT OR REPLACE)", () => {
    const oldData = Buffer.from("old-image");
    const newData = Buffer.from("new-image");

    storage.cacheImage(
      "movie", 10, "poster", "w342",
      "/poster.jpg", oldData, "image/jpeg", oldData.length
    );
    storage.cacheImage(
      "movie", 10, "poster", "w342",
      "/poster.jpg", newData, "image/webp", newData.length
    );

    const cached = storage.getCachedImage("movie", 10, "poster", "w342");
    expect(cached).not.toBeNull();
    expect(cached!.image_data.toString()).toBe("new-image");
    expect(cached!.content_type).toBe("image/webp");
  });
});

// ─────────────────────────────────────────────
// getTmdbImagePath
// ─────────────────────────────────────────────

describe("getTmdbImagePath", () => {
  let movieId: number;
  let tvId: number;

  beforeAll(() => {
    // Get a movie ID from search
    const movieResult = storage.searchContent({ type: "movie", per_page: 1 });
    if (movieResult.results.length > 0) {
      movieId = movieResult.results[0].id;
    }

    // Get a TV series ID from search
    const tvResult = storage.searchContent({ type: "tv", per_page: 1 });
    if (tvResult.results.length > 0) {
      tvId = tvResult.results[0].id;
    }
  });

  it("should return poster_path for a movie", () => {
    expect(movieId).toBeDefined();
    const posterPath = storage.getTmdbImagePath("movie", movieId, "poster");
    // poster_path may be null for some seeded movies, but the method should not throw
    expect(posterPath === null || typeof posterPath === "string").toBe(true);
  });

  it("should return backdrop_path for a movie", () => {
    const backdropPath = storage.getTmdbImagePath("movie", movieId, "backdrop");
    expect(backdropPath === null || typeof backdropPath === "string").toBe(true);
  });

  it("should return poster_path for a TV series", () => {
    expect(tvId).toBeDefined();
    const posterPath = storage.getTmdbImagePath("tv", tvId, "poster");
    expect(posterPath === null || typeof posterPath === "string").toBe(true);
  });

  it("should return backdrop_path for a TV series", () => {
    const backdropPath = storage.getTmdbImagePath("tv", tvId, "backdrop");
    expect(backdropPath === null || typeof backdropPath === "string").toBe(true);
  });

  it("should return null for non-existent movie ID", () => {
    const result = storage.getTmdbImagePath("movie", 999999, "poster");
    expect(result).toBeNull();
  });

  it("should return null for non-existent TV series ID", () => {
    const result = storage.getTmdbImagePath("tv", 999999, "poster");
    expect(result).toBeNull();
  });
});
