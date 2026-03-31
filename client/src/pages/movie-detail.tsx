import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Clock, Calendar, Globe, ExternalLink, ArrowLeft,
  DollarSign, Building2, Tag, Languages,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TmdbImage } from "@/components/tmdb-image";
import { CastCard } from "@/components/cast-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────

interface Genre {
  id: number;
  name: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  display_order: number;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface Keyword {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

interface MovieDetail {
  id: number;
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  status: string | null;
  runtime: number | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  budget: number | null;
  revenue: number | null;
  original_language: string | null;
  spoken_languages: string | null;
  tagline: string | null;
  homepage: string | null;
  imdb_id: string | null;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  keywords: Keyword[];
  production_companies: ProductionCompany[];
}

// ─── Helpers ──────────────────────────────────────

function formatCurrency(amount: number | null | undefined): string {
  if (!amount || amount === 0) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getRatingColor(rating: number): string {
  if (rating >= 7) return "text-emerald-400";
  if (rating >= 5) return "text-amber-400";
  return "text-red-400";
}

// ─── Loading skeleton ─────────────────────────────

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-14">
      <Skeleton className="w-full h-64" />
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative">
        <div className="flex gap-6">
          <Skeleton className="w-40 h-60 rounded-xl flex-shrink-0" />
          <div className="flex-1 pt-24 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Movie Detail ─────────────────────────────────

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: movie, isLoading, error } = useQuery<MovieDetail>({
    queryKey: ["/api/movies", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/movies/${id}`);
      return res.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <MovieDetailSkeleton />;

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Movie not found</p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const directors = movie.crew?.filter((c) => c.job === "Director") ?? [];
  const writers = movie.crew?.filter(
    (c) => c.job === "Screenplay" || c.job === "Writer" || c.job === "Story"
  ) ?? [];
  const producers = movie.crew?.filter((c) => c.job === "Producer") ?? [];

  const spokenLanguages = (() => {
    try {
      return JSON.parse(movie.spoken_languages || "[]") as string[];
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-background pt-14" data-testid="movie-detail">
      {/* Backdrop */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        {movie.backdrop_path ? (
          <TmdbImage
            path={movie.backdrop_path}
            size="w780"
            alt={`${movie.title} backdrop`}
            className="w-full h-full"
            fallbackType="backdrop"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 backdrop-overlay" />
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button
              size="sm"
              variant="ghost"
              className="bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 -mt-20 md:-mt-24 relative z-10">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <TmdbImage
              path={movie.poster_path}
              size="w342"
              alt={movie.title}
              className="w-40 md:w-52 aspect-[2/3] rounded-xl border border-border shadow-xl"
              fallbackType="poster"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-24">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1" data-testid="text-movie-title">
              {movie.title}
            </h1>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-muted-foreground text-sm mb-2">{movie.original_title}</p>
            )}

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-muted-foreground italic text-sm mb-3" data-testid="text-tagline">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
              {movie.release_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRuntime(movie.runtime)}
                </span>
              )}
              {movie.status && (
                <Badge variant="outline" className="text-xs">
                  {movie.status}
                </Badge>
              )}
              {movie.original_language && (
                <span className="flex items-center gap-1.5 uppercase text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  {movie.original_language}
                </span>
              )}
            </div>

            {/* Rating */}
            {movie.vote_average != null && movie.vote_count != null && movie.vote_count > 0 && (
              <div className="flex items-center gap-2 mb-4" data-testid="movie-rating">
                <Star
                  className={`w-5 h-5 fill-current ${getRatingColor(movie.vote_average)}`}
                />
                <span className={`text-xl font-bold ${getRatingColor(movie.vote_average)}`}>
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">
                  / 10 · {movie.vote_count.toLocaleString()} votes
                </span>
              </div>
            )}

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" data-testid="movie-genres">
                {movie.genres.map((g) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">
                    {g.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {movie.tmdb_id && (
                <a
                  href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-tmdb"
                >
                  <Button size="sm" variant="outline" className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on TMDB
                  </Button>
                </a>
              )}
              {movie.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${movie.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-imdb"
                >
                  <Button size="sm" variant="outline" className="gap-2 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    IMDb
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {movie.overview && (
              <section data-testid="section-overview">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Overview
                </h2>
                <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                  {movie.overview}
                </p>
              </section>
            )}

            {/* Cast */}
            {movie.cast?.length > 0 && (
              <section data-testid="section-cast">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Top Cast
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3 scroll-hide">
                  {movie.cast.slice(0, 15).map((member) => (
                    <CastCard
                      key={`${member.id}-${member.character}`}
                      id={member.id}
                      name={member.name}
                      character={member.character}
                      profilePath={member.profile_path}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Crew */}
            {(directors.length > 0 || writers.length > 0) && (
              <section data-testid="section-crew">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Crew
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {directors.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Director</p>
                      {directors.map((d) => (
                        <p key={d.id} className="text-sm font-medium text-foreground">{d.name}</p>
                      ))}
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Writers</p>
                      {writers.slice(0, 3).map((w) => (
                        <p key={w.id} className="text-sm font-medium text-foreground">{w.name}</p>
                      ))}
                    </div>
                  )}
                  {producers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Producers</p>
                      {producers.slice(0, 3).map((p) => (
                        <p key={p.id} className="text-sm font-medium text-foreground">{p.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Keywords */}
            {movie.keywords?.length > 0 && (
              <section data-testid="section-keywords">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {movie.keywords.map((kw) => (
                    <Link key={kw.id} href={`/?q=${encodeURIComponent(kw.name)}`}>
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                        data-testid={`keyword-${kw.id}`}
                      >
                        {kw.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar details */}
          <div className="space-y-6">
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4" data-testid="movie-details-panel">
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Details
              </h2>

              {movie.budget != null && movie.budget > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Budget
                  </p>
                  <p className="text-sm font-medium" data-testid="text-budget">{formatCurrency(movie.budget)}</p>
                </div>
              )}

              {movie.revenue != null && movie.revenue > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Revenue
                  </p>
                  <p className="text-sm font-medium" data-testid="text-revenue">{formatCurrency(movie.revenue)}</p>
                </div>
              )}

              {movie.release_date && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Release Date
                  </p>
                  <p className="text-sm font-medium" data-testid="text-release-date">
                    {new Date(movie.release_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {movie.original_language && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    Language
                  </p>
                  <p className="text-sm font-medium uppercase" data-testid="text-language">{movie.original_language}</p>
                </div>
              )}

              {spokenLanguages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Languages className="w-3.5 h-3.5" />
                    Spoken Languages
                  </p>
                  <p className="text-sm font-medium">{spokenLanguages.join(", ")}</p>
                </div>
              )}

              {movie.production_companies?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Production
                  </p>
                  <div className="space-y-1">
                    {movie.production_companies.map((pc) => (
                      <p key={pc.id} className="text-sm font-medium" data-testid={`production-company-${pc.id}`}>
                        {pc.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
