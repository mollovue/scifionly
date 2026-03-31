import { Link } from "wouter";
import { Star, Tv, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TmdbImage } from "./tmdb-image";

interface ContentCardProps {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null | undefined;
  releaseDate?: string | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  overview?: string | null;
  className?: string;
}

function getRatingColor(rating: number): string {
  if (rating >= 7) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (rating >= 5) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function getYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return dateStr.slice(0, 4);
}

export function ContentCard({
  id,
  type,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  voteCount,
  overview,
  className = "",
}: ContentCardProps) {
  const href = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
  const year = getYear(releaseDate);
  const rating = voteAverage ?? 0;
  const hasRating = voteCount != null && voteCount > 0;

  return (
    <Link href={href}>
      <div
        className={`group relative flex flex-col bg-card border border-card-border rounded-lg overflow-hidden cursor-pointer card-hover ${className}`}
        data-testid={`content-card-${type}-${id}`}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <TmdbImage
            path={posterPath}
            size="w342"
            alt={title}
            className="w-full h-full"
            fallbackType="poster"
          />

          {/* Hover overlay with overview */}
          {overview && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-xs text-foreground/80 line-clamp-4 leading-relaxed">
                {overview}
              </p>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge
              variant="outline"
              className="text-xs py-0.5 px-1.5 bg-background/80 backdrop-blur-sm border-border/50 text-muted-foreground"
              data-testid={`badge-type-${type}-${id}`}
            >
              {type === "movie" ? (
                <Film className="w-3 h-3 mr-1" />
              ) : (
                <Tv className="w-3 h-3 mr-1" />
              )}
              {type === "movie" ? "Movie" : "TV"}
            </Badge>
          </div>

          {/* Rating badge */}
          {hasRating && (
            <div className="absolute top-2 right-2">
              <div
                className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded border backdrop-blur-sm bg-background/80 ${getRatingColor(rating)}`}
                data-testid={`badge-rating-${type}-${id}`}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                {rating.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 flex-1 flex flex-col gap-1">
          <h3
            className="text-sm font-semibold text-foreground leading-tight line-clamp-2"
            data-testid={`text-title-${type}-${id}`}
          >
            {title}
          </h3>
          <span className="text-xs text-muted-foreground" data-testid={`text-year-${type}-${id}`}>
            {year}
          </span>
        </div>
      </div>
    </Link>
  );
}
