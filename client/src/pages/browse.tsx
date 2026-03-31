import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  TrendingUp, Star, Clock, Film, Tv, ChevronRight,
} from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────

interface ContentItem {
  id: number;
  tmdb_id: number;
  type?: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average: number | null;
  vote_count: number | null;
  overview: string | null;
}

interface ContentListResponse {
  results: ContentItem[];
}

// ─── Row skeleton ─────────────────────────────────

function RowSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36">
          <Skeleton className="w-36 aspect-[2/3] rounded-lg" />
          <Skeleton className="h-3 w-3/4 mt-2" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
      ))}
    </div>
  );
}

// ─── Browse Row ───────────────────────────────────

interface BrowseRowProps {
  title: string;
  icon: React.ReactNode;
  items: ContentItem[] | undefined;
  isLoading: boolean;
  type: "movie" | "tv";
  searchParams?: string;
}

function BrowseRow({ title, icon, items, isLoading, type, searchParams }: BrowseRowProps) {
  return (
    <section className="mb-10" data-testid={`browse-row-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {searchParams && (
          <Link href={`/?${searchParams}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary gap-1"
              data-testid={`link-see-all-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <RowSkeleton />
      ) : !items?.length ? (
        <p className="text-muted-foreground text-sm py-4">No content available</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 scroll-hide">
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-36">
              <ContentCard
                id={item.id}
                type={type}
                title={item.title || item.name || "Untitled"}
                posterPath={item.poster_path}
                releaseDate={item.release_date || item.first_air_date}
                voteAverage={item.vote_average}
                voteCount={item.vote_count}
                overview={item.overview}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Browse Page ──────────────────────────────────

export default function Browse() {
  const { data: trendingMoviesData, isLoading: loadingTrendingMovies } = useQuery<ContentListResponse>({
    queryKey: ["/api/movies/trending"],
  });

  const { data: topMoviesData, isLoading: loadingTopMovies } = useQuery<ContentListResponse>({
    queryKey: ["/api/movies/top-rated"],
  });

  const { data: recentMoviesData, isLoading: loadingRecentMovies } = useQuery<ContentListResponse>({
    queryKey: ["/api/movies/recent"],
  });

  const { data: trendingTvData, isLoading: loadingTrendingTv } = useQuery<ContentListResponse>({
    queryKey: ["/api/tv/trending"],
  });

  const { data: topTvData, isLoading: loadingTopTv } = useQuery<ContentListResponse>({
    queryKey: ["/api/tv/top-rated"],
  });

  const trendingMovies = trendingMoviesData?.results;
  const topMovies = topMoviesData?.results;
  const recentMovies = recentMoviesData?.results;
  const trendingTv = trendingTvData?.results;
  const topTv = topTvData?.results;

  return (
    <div className="min-h-screen bg-background pt-14" data-testid="browse-page">
      {/* Page header */}
      <div className="relative overflow-hidden border-b border-border/30">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 50% 0%, hsl(185 80% 50% / 0.06) 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Browse Sci-Fi
          </h1>
          <p className="text-muted-foreground text-sm">
            Discover the best science fiction films and television series
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        {/* Movies section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-6">
            <Film className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Movies</h2>
            <div className="flex-1 h-px bg-border/40 ml-2" />
          </div>

          <BrowseRow
            title="Trending Movies"
            icon={<TrendingUp className="w-4 h-4" />}
            items={trendingMovies}
            isLoading={loadingTrendingMovies}
            type="movie"
            searchParams="sort_by=popularity&sort_order=desc&type=movie"
          />

          <BrowseRow
            title="Top Rated Movies"
            icon={<Star className="w-4 h-4" />}
            items={topMovies}
            isLoading={loadingTopMovies}
            type="movie"
            searchParams="sort_by=vote_average&sort_order=desc&type=movie&min_votes=100"
          />

          <BrowseRow
            title="Recently Released"
            icon={<Clock className="w-4 h-4" />}
            items={recentMovies}
            isLoading={loadingRecentMovies}
            type="movie"
            searchParams="sort_by=release_date&sort_order=desc&type=movie&status=Released"
          />
        </div>

        {/* TV section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Tv className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">TV Series</h2>
            <div className="flex-1 h-px bg-border/40 ml-2" />
          </div>

          <BrowseRow
            title="Trending TV Series"
            icon={<TrendingUp className="w-4 h-4" />}
            items={trendingTv}
            isLoading={loadingTrendingTv}
            type="tv"
            searchParams="sort_by=popularity&sort_order=desc&type=tv"
          />

          <BrowseRow
            title="Top Rated TV Series"
            icon={<Star className="w-4 h-4" />}
            items={topTv}
            isLoading={loadingTopTv}
            type="tv"
            searchParams="sort_by=vote_average&sort_order=desc&type=tv&min_votes=50"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>SciFi Only — The Sci-Fi Universe in one place</p>
          <p>
            This product uses the{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TMDB API
            </a>{" "}
            but is not endorsed or certified by TMDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
