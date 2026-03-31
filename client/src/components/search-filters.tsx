import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface FilterState {
  query: string;
  contentType: "both" | "movie" | "tv";
  yearMin: string;
  yearMax: string;
  ratingMin: string;
  ratingMax: string;
  minVotes: string;
  status: string;
  language: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  contentType: "both",
  yearMin: "",
  yearMax: "",
  ratingMin: "",
  ratingMax: "",
  minVotes: "",
  status: "",
  language: "",
  sortBy: "popularity",
  sortOrder: "desc",
};

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.contentType !== "both") count++;
  if (filters.yearMin || filters.yearMax) count++;
  if (filters.ratingMin || filters.ratingMax) count++;
  if (filters.minVotes) count++;
  if (filters.status) count++;
  if (filters.language) count++;
  if (filters.sortBy !== "popularity" || filters.sortOrder !== "desc") count++;
  return count;
}

interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

function buildActiveChips(
  filters: FilterState,
  onChange: (f: FilterState) => void
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.contentType !== "both") {
    chips.push({
      key: "contentType",
      label: filters.contentType === "movie" ? "Movies only" : "TV only",
      onRemove: () => onChange({ ...filters, contentType: "both" }),
    });
  }
  if (filters.yearMin || filters.yearMax) {
    chips.push({
      key: "year",
      label: `Year: ${filters.yearMin || "any"} – ${filters.yearMax || "any"}`,
      onRemove: () => onChange({ ...filters, yearMin: "", yearMax: "" }),
    });
  }
  if (filters.ratingMin || filters.ratingMax) {
    chips.push({
      key: "rating",
      label: `Rating: ${filters.ratingMin || "0"} – ${filters.ratingMax || "10"}`,
      onRemove: () => onChange({ ...filters, ratingMin: "", ratingMax: "" }),
    });
  }
  if (filters.minVotes) {
    chips.push({
      key: "minVotes",
      label: `Min votes: ${filters.minVotes}`,
      onRemove: () => onChange({ ...filters, minVotes: "" }),
    });
  }
  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${filters.status}`,
      onRemove: () => onChange({ ...filters, status: "" }),
    });
  }
  if (filters.language) {
    chips.push({
      key: "language",
      label: `Language: ${filters.language}`,
      onRemove: () => onChange({ ...filters, language: "" }),
    });
  }

  return chips;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = getActiveFilterCount(filters);
  const chips = buildActiveChips(filters, onChange);

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="w-full" data-testid="search-filters">
      {/* Toggle button */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground gap-2 text-xs"
          data-testid="button-toggle-filters"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Advanced Filters
          {activeCount > 0 && (
            <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
              {activeCount}
            </span>
          )}
        </Button>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-destructive hover:text-destructive text-xs h-7"
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" data-testid="active-filter-chips">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className="gap-1.5 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer pr-1"
              onClick={chip.onRemove}
              data-testid={`chip-filter-${chip.key}`}
            >
              {chip.label}
              <X className="w-3 h-3 opacity-70 hover:opacity-100" />
            </Badge>
          ))}
        </div>
      )}

      {/* Filters panel */}
      {expanded && (
        <div
          className="bg-card border border-card-border rounded-xl p-4 mb-4 animate-fade-in"
          data-testid="filters-panel"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Content Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Content Type
              </Label>
              <div className="flex rounded-lg border border-border overflow-hidden" data-testid="content-type-toggle">
                {(["both", "movie", "tv"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => update({ contentType: type })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      filters.contentType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    data-testid={`button-type-${type}`}
                  >
                    {type === "both" ? "Both" : type === "movie" ? "Movies" : "TV"}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Year Range
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={filters.yearMin}
                  onChange={(e) => update({ yearMin: e.target.value })}
                  className="h-8 text-xs"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  data-testid="input-year-min"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="number"
                  placeholder="To"
                  value={filters.yearMax}
                  onChange={(e) => update({ yearMax: e.target.value })}
                  className="h-8 text-xs"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  data-testid="input-year-max"
                />
              </div>
            </div>

            {/* Rating Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rating Range (0–10)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.ratingMin}
                  onChange={(e) => update({ ratingMin: e.target.value })}
                  className="h-8 text-xs"
                  min="0"
                  max="10"
                  step="0.1"
                  data-testid="input-rating-min"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.ratingMax}
                  onChange={(e) => update({ ratingMax: e.target.value })}
                  className="h-8 text-xs"
                  min="0"
                  max="10"
                  step="0.1"
                  data-testid="input-rating-max"
                />
              </div>
            </div>

            {/* Min Votes */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Minimum Votes
              </Label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={filters.minVotes}
                onChange={(e) => update({ minVotes: e.target.value })}
                className="h-8 text-xs"
                min="0"
                data-testid="input-min-votes"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </Label>
              <Select
                value={filters.status || "__all__"}
                onValueChange={(v) => update({ status: v === "__all__" ? "" : v })}
              >
                <SelectTrigger className="h-8 text-xs" data-testid="select-status">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Any status</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                  <SelectItem value="Post Production">Post Production</SelectItem>
                  <SelectItem value="In Production">In Production</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                  <SelectItem value="Rumored">Rumored</SelectItem>
                  <SelectItem value="Returning Series">Returning Series</SelectItem>
                  <SelectItem value="Ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Original Language
              </Label>
              <Input
                type="text"
                placeholder="e.g. en, ja, fr"
                value={filters.language}
                onChange={(e) => update({ language: e.target.value })}
                className="h-8 text-xs"
                maxLength={5}
                data-testid="input-language"
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sort By
              </Label>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => update({ sortBy: v })}
              >
                <SelectTrigger className="h-8 text-xs" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="vote_average">Rating</SelectItem>
                  <SelectItem value="release_date">Release Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Order
              </Label>
              <div className="flex rounded-lg border border-border overflow-hidden" data-testid="sort-order-toggle">
                {(["desc", "asc"] as const).map((order) => (
                  <button
                    key={order}
                    onClick={() => update({ sortOrder: order })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      filters.sortOrder === order
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    data-testid={`button-order-${order}`}
                  >
                    {order === "desc" ? "Desc" : "Asc"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
