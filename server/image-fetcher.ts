const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT = 30_000; // 30 seconds
const MAX_RETRIES = 3;

export interface FetchImageResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

// In-memory set of currently-fetching image keys for deduplication
const inFlight = new Set<string>();

export function makeImageKey(
  mediaType: string,
  mediaId: number,
  imageType: string,
  size: string
): string {
  return `${mediaType}:${mediaId}:${imageType}:${size}`;
}

export function isInFlight(key: string): boolean {
  return inFlight.has(key);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchTmdbImage(
  tmdbPath: string,
  size: string
): Promise<FetchImageResult> {
  const url = `${TMDB_IMAGE_BASE}/${size}${tmdbPath}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.status === 404) {
        return { success: false, error: "Image not found on TMDB (404)" };
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
        console.warn(`TMDB rate limited, retrying after ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (response.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`TMDB server error (${response.status}), retrying after ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        return { success: false, error: `TMDB returned ${response.status}` };
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.startsWith("image/")) {
        return {
          success: false,
          error: `Invalid Content-Type: ${contentType}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      if (data.length > MAX_IMAGE_SIZE) {
        return {
          success: false,
          error: `Image too large: ${data.length} bytes (max ${MAX_IMAGE_SIZE})`,
        };
      }

      return { success: true, data, contentType };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, error: "Fetch timeout" };
      }
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Fetch error, retrying after ${delay}ms:`, err);
        await sleep(delay);
        continue;
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown fetch error",
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

export async function fetchAndCacheImage(
  key: string,
  tmdbPath: string,
  size: string,
  cacheCallback: (data: Buffer, contentType: string) => void
): Promise<void> {
  if (inFlight.has(key)) {
    return;
  }
  inFlight.add(key);
  try {
    const result = await fetchTmdbImage(tmdbPath, size);
    if (result.success && result.data && result.contentType) {
      cacheCallback(result.data, result.contentType);
    } else {
      console.warn(`Failed to fetch image [${key}]: ${result.error}`);
    }
  } catch (err) {
    console.error(`Error fetching image [${key}]:`, err);
  } finally {
    inFlight.delete(key);
  }
}
