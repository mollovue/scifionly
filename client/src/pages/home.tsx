import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Rocket, TrendingUp, Star, Film, Tv } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ContentCard } from "@/components/content-card";
import { SearchFilters, FilterState, DEFAULT_FILTERS } from "@/components/search-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────

interface SearchResult {
  id: number;
  tmdb_id: number;
  type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  overview: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  per_page: number;
}

interface StatsResponse {
  total_movies: number;
  total_tv_series: number;
  last_sync: string | null;
  last_sync_date?: string | null; // alias
}

// ─── Debounce hook ────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Build search params ──────────────────────────

function buildParams(filters: FilterState, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.contentType !== "both") params.set("type", filters.contentType);
  if (filters.yearMin) params.set("year_min", filters.yearMin);
  if (filters.yearMax) params.set("year_max", filters.yearMax);
  if (filters.ratingMin) params.set("rating_min", filters.ratingMin);
  if (filters.ratingMax) params.set("rating_max", filters.ratingMax);
  if (filters.minVotes) params.set("min_votes", filters.minVotes);
  if (filters.status) params.set("status", filters.status);
  if (filters.language) params.set("language", filters.language);
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortOrder) params.set("sort_order", filters.sortOrder);
  params.set("page", String(page));
  params.set("per_page", "20");
  return params;
}

// ─── Hero stats ───────────────────────────────────

function HeroStats({ stats }: { stats: StatsResponse | undefined }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
      <div className="flex items-center gap-2 text-muted-foreground" data-testid="stat-movies">
        <Film className="w-4 h-4 text-primary" />
        <span className="text-sm">
          <span className="font-semibold text-foreground">
            {stats?.total_movies?.toLocaleString() ?? "—"}
          </span>{" "}
          Movies
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2 text-muted-foreground" data-testid="stat-tv">
        <Tv className="w-4 h-4 text-primary" />
        <span className="text-sm">
          <span className="font-semibold text-foreground">
            {stats?.total_tv_series?.toLocaleString() ?? "—"}
          </span>{" "}
          TV Series
        </span>
      </div>
      {(stats?.last_sync || stats?.last_sync_date) && (
        <>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-muted-foreground">
            Synced: {new Date((stats.last_sync || stats.last_sync_date)!).toLocaleDateString()}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Result grid skeleton ─────────────────────────

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Trending section ─────────────────────────────

interface ContentListResponse {
  results: SearchResult[];
}

function TrendingSection() {
  const { data: trendingMoviesData, isLoading: loadingMovies } = useQuery<ContentListResponse>({
    queryKey: ["/api/movies/trending"],
  });

  const { data: trendingTvData, isLoading: loadingTv } = useQuery<ContentListResponse>({
    queryKey: ["/api/tv/trending"],
  });

  const combined = [
    ...(trendingMoviesData?.results?.slice(0, 5).map((m) => ({ ...m, type: "movie" as const })) ?? []),
    ...(trendingTvData?.results?.slice(0, 5).map((t) => ({ ...t, type: "tv" as const })) ?? []),
  ];

  if (loadingMovies && loadingTv) {
    return (
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Trending Now
          </h2>
        </div>
        <ResultsSkeleton />
      </div>
    );
  }

  if (!combined.length) return null;

  return (
    <div className="mt-10" data-testid="trending-section">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Trending Now
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {combined.map((item) => (
          <ContentCard
            key={`${item.type}-${item.id}`}
            id={item.id}
            type={item.type}
            title={item.title}
            posterPath={item.poster_path}
            releaseDate={item.release_date}
            voteAverage={item.vote_average}
            voteCount={item.vote_count}
            overview={item.overview}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Home Component ──────────────────────────

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedFilters = useDebounce(filters, 300);

  // Stats query
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  // Determine if we have an active search
  const isSearching =
    debouncedFilters.query.length > 0 ||
    debouncedFilters.contentType !== "both" ||
    !!debouncedFilters.yearMin ||
    !!debouncedFilters.yearMax ||
    !!debouncedFilters.ratingMin ||
    !!debouncedFilters.ratingMax ||
    !!debouncedFilters.minVotes ||
    !!debouncedFilters.status ||
    !!debouncedFilters.language;

  // Search query
  const searchParams = buildParams(debouncedFilters, page);

  const { data: searchData, isLoading, isFetching } = useQuery<SearchResponse>({
    queryKey: ["/api/search", searchParams.toString()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/search?${searchParams.toString()}`);
      return res.json();
    },
    enabled: isSearching,
    staleTime: 1000 * 60 * 5,
  });

  // Reset + accumulate results on filter change
  useEffect(() => {
    setPage(1);
    setAllResults([]);
  }, [debouncedFilters]);

  // Accumulate results for "load more"
  useEffect(() => {
    if (!searchData?.results) return;
    if (page === 1) {
      setAllResults(searchData.results);
    } else {
      setAllResults((prev) => {
        const existingIds = new Set(prev.map((r) => `${r.type}-${r.id}`));
        const newResults = searchData.results.filter(
          (r) => !existingIds.has(`${r.type}-${r.id}`)
        );
        return [...prev, ...newResults];
      });
    }
  }, [searchData, page]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const hasMore =
    searchData &&
    allResults.length < searchData.total;

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-5 dark:opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(185 80% 50% / 0.08) 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Rocket className="w-3.5 h-3.5" />
            Powered by TMDB · All Sci-Fi, All the Time
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3">
            <span className="text-gradient-cyan">Explore the Sci-Fi</span>
            <br />
            <span className="text-foreground">Universe</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Search across movies and TV series from TMDB. Multi-criteria search with AND logic.
          </p>

          <HeroStats stats={stats} />
        </div>
      </div>

      {/* Search + Filters */}
      <div className="max-w-4xl mx-auto px-4 pb-4" data-testid="search-section">
        {/* Search Input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            {isFetching && isSearching ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="search"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search titles, descriptions, cast, crew..."
            className="w-full pl-12 pr-4 py-3.5 text-base bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all glow-cyan-hover"
            style={{ fontSize: "16px" }} // prevent iOS zoom
            data-testid="input-search"
          />
        </div>

        {/* Filters */}
        <SearchFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isSearching ? (
          <>
            {/* Results header */}
            {!isLoading && searchData && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                  {searchData.total.toLocaleString()} result{searchData.total !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && page === 1 && <ResultsSkeleton />}

            {/* Results grid */}
            {allResults.length > 0 && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                data-testid="results-grid"
              >
                {allResults.map((item) => (
                  <ContentCard
                    key={`${item.type}-${item.id}`}
                    id={item.id}
                    type={item.type}
                    title={item.title}
                    posterPath={item.poster_path}
                    releaseDate={item.release_date}
                    voteAverage={item.vote_average}
                    voteCount={item.vote_count}
                    overview={item.overview}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && allResults.length === 0 && (
              <div className="text-center py-20" data-testid="empty-state">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No results found. Try different search terms or filters.</p>
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
                  data-testid="button-load-more"
                >
                  {isFetching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <TrendingSection />
        )}
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
