import { useState, useEffect, useRef } from "react";
import { Film, User, Image } from "lucide-react";

type ImageSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "original";

interface TmdbImageProps {
  path: string | null | undefined;
  size?: ImageSize;
  alt: string;
  className?: string;
  fallbackType?: "poster" | "backdrop" | "profile" | "generic";
  mediaType?: "movie" | "tv";
  mediaId?: number;
  imageType?: "poster" | "backdrop";
}

const TMDB_BASE = "https://image.tmdb.org/t/p";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function TmdbImage({
  path,
  size = "w342",
  alt,
  className = "",
  fallbackType = "poster",
  mediaType,
  mediaId,
  imageType,
}: TmdbImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const useCacheApi = mediaType != null && mediaId != null && imageType != null;

  useEffect(() => {
    if (!useCacheApi) return;

    let cancelled = false;
    retriesRef.current = 0;

    async function fetchFromCache() {
      const controller = new AbortController();
      abortRef.current = controller;
      setFetching(true);

      try {
        const res = await fetch(
          `/api/images/${mediaType}/${mediaId}/${imageType}?size=${size}`,
          { signal: controller.signal }
        );

        if (cancelled) return;

        if (res.status === 200) {
          const blob = await res.blob();
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setFetching(false);
          return;
        }

        if (res.status === 202 && retriesRef.current < MAX_RETRIES) {
          retriesRef.current += 1;
          setTimeout(() => {
            if (!cancelled) fetchFromCache();
          }, RETRY_DELAY);
          return;
        }

        // 404 or retries exhausted — fall back to placeholder
        setError(true);
        setFetching(false);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
        setFetching(false);
      }
    }

    fetchFromCache();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      // Clean up blob URL
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [useCacheApi, mediaType, mediaId, imageType, size]);

  // Placeholder fallback
  if ((!path && !useCacheApi) || (error && !blobUrl)) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        aria-label={alt}
      >
        {fallbackType === "profile" ? (
          <User className="w-1/3 h-1/3 opacity-40" />
        ) : fallbackType === "backdrop" ? (
          <Image className="w-1/4 h-1/4 opacity-30" />
        ) : (
          <Film className="w-1/3 h-1/3 opacity-40" />
        )}
      </div>
    );
  }

  // Cache API loading state (skeleton)
  if (useCacheApi && fetching && !blobUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
      </div>
    );
  }

  const url = blobUrl ?? `${TMDB_BASE}/${size}${path}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
      )}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
