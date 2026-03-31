import { useState } from "react";
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
}

const TMDB_BASE = "https://image.tmdb.org/t/p";

export function TmdbImage({
  path,
  size = "w342",
  alt,
  className = "",
  fallbackType = "poster",
}: TmdbImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!path || error) {
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

  const url = `${TMDB_BASE}/${size}${path}`;

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
