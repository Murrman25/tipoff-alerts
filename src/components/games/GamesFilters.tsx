import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search, Filter, X, ChevronDown, Users } from "lucide-react";
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
  GAME_STATUSES,
  LeagueID,
  BookmakerID,
  BetTypeID,
} from "@/types/games";
import { cn } from "@/lib/utils";
import { LeagueLogo } from "./LeagueLogo";

export interface TeamSearchOption {
  id: string;
  name: string;
  league: string;
  logoUrl?: string | null;
}

interface GamesFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  totalResults: number;
  isLoading?: boolean;
  statusLocked?: boolean;
  statusHelperText?: string;
  teamOptions?: TeamSearchOption[];
  onSelectSearchTeam?: (team: TeamSearchOption) => void;
  onClearSearchTeam?: () => void;
}

export const GamesFilters = ({
  filters,
  onFiltersChange,
  totalResults,
  isLoading,
  statusLocked = false,
  statusHelperText,
  teamOptions = [],
  onSelectSearchTeam,
  onClearSearchTeam,
}: GamesFiltersProps) => {
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const teamMenuId = useId();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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
      status: "live",
      searchQuery: "",
      searchTeam: null,
      oddsAvailable: false,
    });
    onClearSearchTeam?.();
  };

  const activeFilterCount =
    (!statusLocked && filters.status !== "live" ? 1 : 0) +
    filters.leagueID.length +
    filters.bookmakerID.length +
    filters.betTypeID.length +
    (filters.oddsAvailable ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const displayedStatus = statusLocked ? "all" : filters.status;
  const hasSearchQuery = filters.searchQuery.trim().length > 0;
  const showTeamMenu = isTeamMenuOpen && hasSearchQuery && teamOptions.length > 0;

  const handleSearchChange = (value: string) => {
    if (filters.searchTeam && value.trim() !== filters.searchTeam.name) {
      onClearSearchTeam?.();
    }
    updateFilter("searchQuery", value);
    if (value.trim().length > 0) {
      setIsTeamMenuOpen(true);
    } else {
      setIsTeamMenuOpen(false);
    }
  };

  const selectTeam = (team: TeamSearchOption) => {
    updateFilter("searchQuery", team.name);
    onSelectSearchTeam?.(team);
    setIsTeamMenuOpen(false);
    setActiveTeamIndex(0);
  };

  const handleClearSelectedTeam = () => {
    updateFilter("searchQuery", "");
    onClearSearchTeam?.();
    setIsTeamMenuOpen(false);
  };

  useEffect(() => {
    setActiveTeamIndex(0);
  }, [filters.searchQuery, teamOptions.length]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      const target = event.target as Node | null;
      if (target && searchContainerRef.current.contains(target)) {
        return;
      }
      setIsTeamMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showTeamMenu) {
      if (event.key === "ArrowDown" && teamOptions.length > 0) {
        event.preventDefault();
        setIsTeamMenuOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveTeamIndex((prev) => (prev + 1) % teamOptions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveTeamIndex((prev) => (prev - 1 + teamOptions.length) % teamOptions.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = teamOptions[activeTeamIndex];
      if (active) {
        selectTeam(active);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsTeamMenuOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1" ref={searchContainerRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams or games..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (hasSearchQuery && teamOptions.length > 0) {
                setIsTeamMenuOpen(true);
              }
            }}
            onKeyDown={onSearchKeyDown}
            role="combobox"
            aria-expanded={showTeamMenu}
            aria-controls={teamMenuId}
            aria-autocomplete="list"
            className="pl-9 bg-secondary/50 border-border"
          />
          {showTeamMenu && (
            <div
              id={teamMenuId}
              role="listbox"
              className="absolute top-full z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
            >
              {teamOptions.map((team, index) => (
                <button
                  key={team.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeTeamIndex}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                    index === activeTeamIndex && "bg-accent",
                  )}
                  onMouseEnter={() => setActiveTeamIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectTeam(team)}
                >
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Users className="h-3 w-3" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.league}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Game status selector */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg border border-border">
            {GAME_STATUSES.map((status) => (
              <button
                key={status.id}
                onClick={() => {
                  if (statusLocked) return;
                  updateFilter("status", status.id);
                }}
                disabled={statusLocked}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  statusLocked && "cursor-not-allowed opacity-70",
                  displayedStatus === status.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filters.searchTeam && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Selected team:</span>
          <Badge variant="secondary" className="gap-2">
            {filters.searchTeam.logoUrl ? (
              <img
                src={filters.searchTeam.logoUrl}
                alt={filters.searchTeam.name}
                className="h-4 w-4 object-contain"
                loading="lazy"
              />
            ) : (
              <Users className="h-3 w-3" />
            )}
            <span>{filters.searchTeam.name}</span>
            <button
              type="button"
              onClick={handleClearSelectedTeam}
              aria-label="Clear selected team"
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {statusLocked && statusHelperText && (
        <p className="text-xs text-muted-foreground">{statusHelperText}</p>
      )}

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
