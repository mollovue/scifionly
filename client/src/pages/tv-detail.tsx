import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Calendar, Globe, ExternalLink, ArrowLeft,
  Tv, Layers, PlaySquare, Tag, Radio,
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

interface TvDetail {
  id: number;
  tmdb_id: number;
  name: string;
  original_name: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  status: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  episode_run_time: string | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  original_language: string | null;
  spoken_languages: string | null;
  tagline: string | null;
  homepage: string | null;
  networks: string | null;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  keywords: Keyword[];
}

// ─── Helpers ──────────────────────────────────────

function getRatingColor(rating: number): string {
  if (rating >= 7) return "text-emerald-400";
  if (rating >= 5) return "text-amber-400";
  return "text-red-400";
}

function parseJsonArray(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function getStatusColor(status: string | null): string {
  if (!status) return "bg-secondary text-secondary-foreground";
  if (status.toLowerCase().includes("return")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (status.toLowerCase().includes("end") || status.toLowerCase().includes("cancel")) return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-secondary text-secondary-foreground";
}

// ─── Loading skeleton ─────────────────────────────

function TvDetailSkeleton() {
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

// ─── TV Detail ────────────────────────────────────

export default function TvDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: show, isLoading, error } = useQuery<TvDetail>({
    queryKey: ["/api/tv", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tv/${id}`);
      return res.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <TvDetailSkeleton />;

  if (error || !show) {
    return (
      <div className="min-h-screen bg-background pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">TV series not found</p>
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

  const creators = show.crew?.filter(
    (c) => c.job === "Creator" || c.job === "Executive Producer"
  ) ?? [];
  const writers = show.crew?.filter((c) => c.job === "Writer") ?? [];
  const networks = parseJsonArray(show.networks);
  const episodeRuntimes = parseJsonArray(show.episode_run_time);
  const spokenLanguages = parseJsonArray(show.spoken_languages);

  return (
    <div className="min-h-screen bg-background pt-14" data-testid="tv-detail">
      {/* Backdrop */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        {show.backdrop_path ? (
          <TmdbImage
            path={show.backdrop_path}
            size="w780"
            alt={`${show.name} backdrop`}
            className="w-full h-full"
            fallbackType="backdrop"
            mediaType="tv"
            mediaId={show.id}
            imageType="backdrop"
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
              path={show.poster_path}
              size="w342"
              alt={show.name}
              className="w-40 md:w-52 aspect-[2/3] rounded-xl border border-border shadow-xl"
              fallbackType="poster"
              mediaType="tv"
              mediaId={show.id}
              imageType="poster"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-24">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1" data-testid="text-tv-title">
              {show.name}
            </h1>
            {show.original_name && show.original_name !== show.name && (
              <p className="text-muted-foreground text-sm mb-2">{show.original_name}</p>
            )}

            {/* Tagline */}
            {show.tagline && (
              <p className="text-muted-foreground italic text-sm mb-3" data-testid="text-tagline">
                "{show.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
              {show.first_air_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(show.first_air_date).getFullYear()}
                  {show.last_air_date && show.last_air_date !== show.first_air_date && (
                    <> – {new Date(show.last_air_date).getFullYear()}</>
                  )}
                </span>
              )}
              {show.number_of_seasons != null && (
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {show.number_of_seasons} Season{show.number_of_seasons !== 1 ? "s" : ""}
                </span>
              )}
              {show.number_of_episodes != null && (
                <span className="flex items-center gap-1.5">
                  <PlaySquare className="w-3.5 h-3.5" />
                  {show.number_of_episodes} Episode{show.number_of_episodes !== 1 ? "s" : ""}
                </span>
              )}
              {show.status && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getStatusColor(show.status)}`}
                  data-testid="badge-status"
                >
                  {show.status}
                </Badge>
              )}
              {show.original_language && (
                <span className="flex items-center gap-1.5 uppercase text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  {show.original_language}
                </span>
              )}
            </div>

            {/* Rating */}
            {show.vote_average != null && show.vote_count != null && show.vote_count > 0 && (
              <div className="flex items-center gap-2 mb-4" data-testid="tv-rating">
                <Star
                  className={`w-5 h-5 fill-current ${getRatingColor(show.vote_average)}`}
                />
                <span className={`text-xl font-bold ${getRatingColor(show.vote_average)}`}>
                  {show.vote_average.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">
                  / 10 · {show.vote_count.toLocaleString()} votes
                </span>
              </div>
            )}

            {/* Genres */}
            {show.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" data-testid="tv-genres">
                {show.genres.map((g) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">
                    {g.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Networks */}
            {networks.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-medium">{networks.join(", ")}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {show.tmdb_id && (
                <a
                  href={`https://www.themoviedb.org/tv/${show.tmdb_id}`}
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
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {show.overview && (
              <section data-testid="section-overview">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Overview
                </h2>
                <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                  {show.overview}
                </p>
              </section>
            )}

            {/* Cast */}
            {show.cast?.length > 0 && (
              <section data-testid="section-cast">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Top Cast
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3 scroll-hide">
                  {show.cast.slice(0, 15).map((member) => (
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
            {creators.length > 0 && (
              <section data-testid="section-crew">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Crew
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {creators.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Creators</p>
                      {creators.slice(0, 5).map((c) => (
                        <p key={c.id} className="text-sm font-medium text-foreground">{c.name}</p>
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
                </div>
              </section>
            )}

            {/* Keywords */}
            {show.keywords?.length > 0 && (
              <section data-testid="section-keywords">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {show.keywords.map((kw) => (
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
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4" data-testid="tv-details-panel">
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                Details
              </h2>

              {show.first_air_date && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    First Aired
                  </p>
                  <p className="text-sm font-medium" data-testid="text-first-air">
                    {new Date(show.first_air_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {show.last_air_date && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Last Aired
                  </p>
                  <p className="text-sm font-medium" data-testid="text-last-air">
                    {new Date(show.last_air_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {show.number_of_seasons != null && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Layers className="w-3.5 h-3.5" />
                    Seasons
                  </p>
                  <p className="text-sm font-medium" data-testid="text-seasons">{show.number_of_seasons}</p>
                </div>
              )}

              {show.number_of_episodes != null && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <PlaySquare className="w-3.5 h-3.5" />
                    Episodes
                  </p>
                  <p className="text-sm font-medium" data-testid="text-episodes">{show.number_of_episodes}</p>
                </div>
              )}

              {episodeRuntimes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Tv className="w-3.5 h-3.5" />
                    Episode Runtime
                  </p>
                  <p className="text-sm font-medium" data-testid="text-runtime">
                    {episodeRuntimes.join(", ")} min
                  </p>
                </div>
              )}

              {show.original_language && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    Language
                  </p>
                  <p className="text-sm font-medium uppercase" data-testid="text-language">{show.original_language}</p>
                </div>
              )}

              {networks.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Radio className="w-3.5 h-3.5" />
                    Networks
                  </p>
                  <p className="text-sm font-medium" data-testid="text-networks">{networks.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
