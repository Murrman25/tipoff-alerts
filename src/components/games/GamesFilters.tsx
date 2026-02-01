import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  GamesFilters as FiltersType,
  LEAGUES,
  BOOKMAKERS,
  BET_TYPES,
  DATE_RANGES,
  LeagueID,
  BookmakerID,
  BetTypeID,
} from "@/types/games";
import { cn } from "@/lib/utils";
import { LeagueLogo } from "./LeagueLogo";

interface GamesFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  totalResults: number;
  isLoading?: boolean;
}

export const GamesFilters = ({
  filters,
  onFiltersChange,
  totalResults,
  isLoading,
}: GamesFiltersProps) => {
  const updateFilter = <K extends keyof FiltersType>(
    key: K,
    value: FiltersType[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T extends LeagueID | BookmakerID | BetTypeID>(
    key: "leagueID" | "bookmakerID" | "betTypeID",
    value: T
  ) => {
    const current = filters[key] as T[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated as FiltersType[typeof key]);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      leagueID: [],
      bookmakerID: [],
      betTypeID: [],
      searchQuery: "",
      dateRange: "today",
      oddsAvailable: true,
    });
  };

  const activeFilterCount =
    filters.leagueID.length +
    filters.bookmakerID.length +
    filters.betTypeID.length +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, players..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
          />
        </div>

        {/* Date range selector */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg border border-border">
          {DATE_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => updateFilter("dateRange", range.id)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                filters.dateRange === range.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* League filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                filters.leagueID.length > 0 && "border-primary/50"
              )}
            >
              <Filter className="w-4 h-4" />
              League
              {filters.leagueID.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filters.leagueID.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Select Leagues</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2">
              {LEAGUES.map((league) => (
                <label
                  key={league.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.leagueID.includes(league.id)}
                    onCheckedChange={() =>
                      toggleArrayFilter("leagueID", league.id)
                    }
                  />
                  <LeagueLogo leagueId={league.id} size={18} />
                  <span className="text-sm">{league.name}</span>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bookmaker filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                filters.bookmakerID.length > 0 && "border-primary/50"
              )}
            >
              Sportsbook
              {filters.bookmakerID.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filters.bookmakerID.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Select Sportsbooks</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2">
              {BOOKMAKERS.map((book) => (
                <label
                  key={book.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.bookmakerID.includes(book.id)}
                    onCheckedChange={() =>
                      toggleArrayFilter("bookmakerID", book.id)
                    }
                  />
                  <span className="text-sm">{book.name}</span>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bet type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                filters.betTypeID.length > 0 && "border-primary/50"
              )}
            >
              Bet Type
              {filters.betTypeID.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {filters.betTypeID.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Bet Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2">
              {BET_TYPES.map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.betTypeID.includes(type.id)}
                    onCheckedChange={() =>
                      toggleArrayFilter("betTypeID", type.id)
                    }
                  />
                  <div>
                    <span className="text-sm font-medium">{type.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Odds available toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/30 cursor-pointer">
          <Checkbox
            checked={filters.oddsAvailable}
            onCheckedChange={(checked) =>
              updateFilter("oddsAvailable", checked === true)
            }
          />
          <span className="text-sm">Odds available</span>
        </label>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Clear all
          </Button>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <span>
              <span className="text-primary font-semibold">{totalResults}</span>{" "}
              games found
            </span>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {(filters.leagueID.length > 0 ||
        filters.bookmakerID.length > 0 ||
        filters.betTypeID.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.leagueID.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1.5 cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("leagueID", id)}
            >
              <LeagueLogo leagueId={id} size={14} />
              {LEAGUES.find((l) => l.id === id)?.name}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.bookmakerID.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("bookmakerID", id)}
            >
              {BOOKMAKERS.find((b) => b.id === id)?.name}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.betTypeID.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleArrayFilter("betTypeID", id)}
            >
              {BET_TYPES.find((t) => t.id === id)?.name}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
