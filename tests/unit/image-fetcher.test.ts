/**
 * Unit tests for the image fetcher utility.
 *
 * Tests fetchTmdbImage and fetchAndCacheImage with mocked HTTP responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTmdbImage,
  fetchAndCacheImage,
  makeImageKey,
  isInFlight,
} from "../../server/image-fetcher.js";

// ─────────────────────────────────────────────
// makeImageKey
// ─────────────────────────────────────────────

describe("makeImageKey", () => {
  it("should create a colon-separated key", () => {
    expect(makeImageKey("movie", 42, "poster", "w342")).toBe("movie:42:poster:w342");
  });

  it("should create different keys for different sizes", () => {
    const key1 = makeImageKey("movie", 42, "poster", "w342");
    const key2 = makeImageKey("movie", 42, "poster", "w500");
    expect(key1).not.toBe(key2);
  });

  it("should create different keys for movie vs tv", () => {
    const key1 = makeImageKey("movie", 1, "poster", "w342");
    const key2 = makeImageKey("tv", 1, "poster", "w342");
    expect(key1).not.toBe(key2);
  });

  it("should create different keys for poster vs backdrop", () => {
    const key1 = makeImageKey("movie", 1, "poster", "w342");
    const key2 = makeImageKey("movie", 1, "backdrop", "w342");
    expect(key1).not.toBe(key2);
  });
});

// ─────────────────────────────────────────────
// fetchTmdbImage — with mocked fetch
// ─────────────────────────────────────────────

describe("fetchTmdbImage", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should successfully fetch an image", async () => {
    const imageBuffer = Buffer.from("fake-image-data");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    }) as any;

    const result = await fetchTmdbImage("/test.jpg", "w342");
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.contentType).toBe("image/jpeg");
  });

  it("should handle 404 from TMDB without retrying", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    }) as any;

    const result = await fetchTmdbImage("/missing.jpg", "w342");
    expect(result.success).toBe(false);
    expect(result.error).toContain("404");
    // Should only be called once (no retry on 404)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("should reject non-image Content-Type", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "text/html" }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    }) as any;

    const result = await fetchTmdbImage("/bad.jpg", "w342");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Content-Type");
  });

  it("should reject oversized images (> 5MB)", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(largeBuffer.buffer.slice(
        largeBuffer.byteOffset,
        largeBuffer.byteOffset + largeBuffer.byteLength
      )),
    }) as any;

    const result = await fetchTmdbImage("/huge.jpg", "w342");
    expect(result.success).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("should handle fetch timeout (AbortError)", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    }) as any;

    const result = await fetchTmdbImage("/slow.jpg", "w342");
    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
  });

  it("should retry on 5xx server errors", async () => {
    let callCount = 0;
    const imageBuffer = Buffer.from("retry-success");

    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 503,
          headers: new Headers(),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
          imageBuffer.byteOffset,
          imageBuffer.byteOffset + imageBuffer.byteLength
        )),
      });
    }) as any;

    const result = await fetchTmdbImage("/retry.jpg", "w342");
    expect(result.success).toBe(true);
    expect(callCount).toBe(3);
  });

  it("should handle image/webp content type", async () => {
    const imageBuffer = Buffer.from("webp-data");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/webp" }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    }) as any;

    const result = await fetchTmdbImage("/test.jpg", "w342");
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image/webp");
  });

  it("should handle image/png content type", async () => {
    const imageBuffer = Buffer.from("png-data");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/png" }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    }) as any;

    const result = await fetchTmdbImage("/test.png", "w342");
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image/png");
  });

  it("should handle network errors with retry", async () => {
    let callCount = 0;
    const imageBuffer = Buffer.from("success-after-network-error");

    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.reject(new Error("ECONNRESET"));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
          imageBuffer.byteOffset,
          imageBuffer.byteOffset + imageBuffer.byteLength
        )),
      });
    }) as any;

    const result = await fetchTmdbImage("/net-err.jpg", "w342");
    expect(result.success).toBe(true);
    expect(callCount).toBe(2);
  });
});

// ─────────────────────────────────────────────
// fetchAndCacheImage — deduplication
// ─────────────────────────────────────────────

describe("fetchAndCacheImage", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should call the cache callback on success", async () => {
    const imageBuffer = Buffer.from("cached-image");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    }) as any;

    const cacheCallback = vi.fn();
    const key = "test:100:poster:w342";

    await fetchAndCacheImage(key, "/poster.jpg", "w342", cacheCallback);

    expect(cacheCallback).toHaveBeenCalledOnce();
    expect(cacheCallback).toHaveBeenCalledWith(
      expect.any(Buffer),
      "image/jpeg"
    );
  });

  it("should not call cache callback on failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    }) as any;

    const cacheCallback = vi.fn();
    const key = "test:101:poster:w342";

    await fetchAndCacheImage(key, "/missing.jpg", "w342", cacheCallback);

    expect(cacheCallback).not.toHaveBeenCalled();
  });

  it("should clear in-flight status after completion", async () => {
    const imageBuffer = Buffer.from("inflight-test");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    }) as any;

    const key = "test:102:poster:w342";
    await fetchAndCacheImage(key, "/poster.jpg", "w342", vi.fn());

    // After completion, the key should no longer be in-flight
    expect(isInFlight(key)).toBe(false);
  });

  it("should clear in-flight status even on error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as any;

    const key = "test:103:poster:w342";
    await fetchAndCacheImage(key, "/err.jpg", "w342", vi.fn());

    expect(isInFlight(key)).toBe(false);
  });
});
