import { useState, useMemo, useCallback, useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { PageGlow } from "@/components/PageGlow";
import { GamesFilters } from "@/components/games/GamesFilters";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { EmptyGamesState, EmptyGamesStateVariant } from "@/components/games/EmptyGamesState";
import { FavoriteTeamsFilter } from "@/components/games/FavoriteTeamsFilter";
import { GamesFilters as FiltersType } from "@/types/games";
import { useGames } from "@/hooks/useGames";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import { Button } from "@/components/ui/button";
import { useGamesStream } from "@/hooks/useGamesStream";
import { resolveCanonicalTeamIDs, suggestTeams } from "@/lib/teamSearch";
import { getLogoUrl } from "@/components/TeamLogo";
import { cn } from "@/lib/utils";

const LEAGUE_MIXED_WINDOW_DAYS = 3;
const LEAGUE_MIXED_LIMIT = 25;
const GLOBAL_UPCOMING_FALLBACK_LIMIT = 25;
const TEAM_SEARCH_HORIZON_DAYS = 30;
const REFRESH_STALE_MS = 90_000;

function formatRefreshTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function deriveRefreshStatus(params: {
  isFetching: boolean;
  lastRefreshAtMs: number | null;
  nowMs: number;
}): { tone: "fresh" | "warn"; text: string } {
  const { isFetching, lastRefreshAtMs, nowMs } = params;
  if (!lastRefreshAtMs || !Number.isFinite(lastRefreshAtMs)) {
    return {
      tone: "warn",
      text: "Initializing data…",
    };
  }

  const ageMs = Math.max(0, nowMs - lastRefreshAtMs);
  const formattedTime = formatRefreshTime(lastRefreshAtMs);
  if (isFetching) {
    return {
      tone: "warn",
      text: `Updating… • Last refresh ${formattedTime}`,
    };
  }
  if (ageMs > REFRESH_STALE_MS) {
    return {
      tone: "warn",
      text: `May be stale • Last refresh ${formattedTime}`,
    };
  }
  return {
    tone: "fresh",
    text: `Up to date • Last refresh ${formattedTime}`,
  };
}

export function sortGamesForDisplay<T extends { eventID: string; status: { started: boolean; ended: boolean; startsAt: string } }>(
  games: T[],
): T[] {
  return [...games].sort((a, b) => {
    const aLive = a.status.started && !a.status.ended;
    const bLive = b.status.started && !b.status.ended;

    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;

    return new Date(a.status.startsAt).getTime() - new Date(b.status.startsAt).getTime();
  });
}

export function buildVisibleEventIds<T extends { eventID: string }>(games: T[], limit = 12): string[] {
  const unique = Array.from(new Set(games.map((game) => game.eventID).filter(Boolean)));
  return unique.slice(0, limit);
}

function applyFavoriteFilterAndSort<T extends { status: { started: boolean; ended: boolean; startsAt: string }; teams: { home: { canonical?: { id: string } | null }; away: { canonical?: { id: string } | null } } }>(
  games: T[] | undefined,
  favoriteTeamIds: string[],
): T[] {
  if (!games) {
    return [];
  }

  let result = games;
  if (favoriteTeamIds.length > 0) {
    result = result.filter((game) =>
      favoriteTeamIds.some(
        (teamId) =>
          game.teams.home.canonical?.id === teamId ||
          game.teams.away.canonical?.id === teamId,
      ),
    );
  }

  return sortGamesForDisplay(result);
}

export function buildEffectiveGamesFilters(
  filters: FiltersType,
  resolvedTeamIDs: string[],
  nowMs = Date.now(),
): { isLeagueMixedMode: boolean; effectiveFilters: FiltersType } {
  const isLeagueMixedMode = filters.leagueID.length > 0;
  const nowIso = new Date(nowMs).toISOString();

  const nextFilters: FiltersType = {
    ...filters,
    teamID: resolvedTeamIDs,
    from: undefined,
    to: undefined,
    limit: undefined,
  };

  if (isLeagueMixedMode) {
    return {
      isLeagueMixedMode,
      effectiveFilters: {
        ...nextFilters,
        status: "all",
        from: nowIso,
        to: new Date(nowMs + LEAGUE_MIXED_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        limit: LEAGUE_MIXED_LIMIT,
      },
    };
  }

  if (resolvedTeamIDs.length > 0) {
    return {
      isLeagueMixedMode,
      effectiveFilters: {
        ...nextFilters,
        from: nowIso,
        to: new Date(nowMs + TEAM_SEARCH_HORIZON_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  return {
    isLeagueMixedMode,
    effectiveFilters: nextFilters,
  };
}

export function deriveEmptyStateVariant(params: {
  isLeagueMixedMode: boolean;
  isDefaultLiveView: boolean;
  hasNarrowingFilters: boolean;
}): EmptyGamesStateVariant {
  if (params.isLeagueMixedMode && !params.hasNarrowingFilters) {
    return "leagueWindowEmpty";
  }
  if (params.isDefaultLiveView && !params.hasNarrowingFilters) {
    return "globalNoLive";
  }
  return "filtered";
}

export function normalizeGamesFiltersOnLeagueChange(
  previousFilters: FiltersType,
  nextFilters: FiltersType,
): FiltersType {
  if (previousFilters.leagueID.length > 0 && nextFilters.leagueID.length === 0) {
    return {
      ...nextFilters,
      status: "live",
    };
  }

  return nextFilters;
}

export function shouldFetchGlobalUpcomingFallback(params: {
  isLeagueMixedMode: boolean;
  status: FiltersType["status"];
  hasNarrowingFilters: boolean;
  isPrimaryLoading: boolean;
  hasPrimaryError: boolean;
  primaryVisibleCount: number;
}): boolean {
  return (
    !params.isLeagueMixedMode &&
    params.status === "live" &&
    !params.hasNarrowingFilters &&
    !params.isPrimaryLoading &&
    !params.hasPrimaryError &&
    params.primaryVisibleCount === 0
  );
}

const Games = () => {
  const [filters, setFilters] = useState<FiltersType>({
    leagueID: [],
    bookmakerID: [],
    betTypeID: [],
    status: "live",
    searchQuery: "",
    searchTeam: null,
    oddsAvailable: false,
  });
  const [selectedFavoriteTeamIds, setSelectedFavoriteTeamIds] = useState<string[]>([]);
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockMs(Date.now());
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Fetch favorite teams
  const { allTeams, favoriteTeams, isLoading: favoritesLoading } = useFavoriteTeams();

  const teamSuggestions = useMemo(() => {
    const suggestions = suggestTeams(filters.searchQuery, allTeams, {
      leagueIDs: filters.leagueID,
      maxResults: 8,
    });
    return suggestions.map((team) => ({
      id: team.id,
      name: team.name,
      league: team.league,
      logoUrl: getLogoUrl(team.logoFilename),
    }));
  }, [allTeams, filters.searchQuery, filters.leagueID]);

  const resolvedTeamIDs = useMemo(
    () => {
      if (filters.searchTeam?.id) {
        return [filters.searchTeam.id];
      }
      return (
      resolveCanonicalTeamIDs(filters.searchQuery, allTeams, {
        leagueIDs: filters.leagueID,
        maxResults: 3,
      })
      );
    },
    [allTeams, filters.searchQuery, filters.leagueID, filters.searchTeam],
  );

  const { isLeagueMixedMode, effectiveFilters } = useMemo(
    () => buildEffectiveGamesFilters(filters, resolvedTeamIDs),
    [filters, resolvedTeamIDs],
  );

  // Fetch primary games from the API
  const {
    data: primaryGames,
    isLoading: isPrimaryLoading,
    error: primaryError,
    refetch: refetchPrimary,
    isFetching: isPrimaryFetching,
    dataUpdatedAt: primaryDataUpdatedAt,
  } = useGames(effectiveFilters);

  const handleToggleFavoriteTeam = (teamId: string) => {
    setSelectedFavoriteTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const primaryFilteredGames = useMemo(
    () => applyFavoriteFilterAndSort(primaryGames, selectedFavoriteTeamIds),
    [primaryGames, selectedFavoriteTeamIds],
  );

  const hasNarrowingFilters =
    filters.bookmakerID.length > 0 ||
    filters.betTypeID.length > 0 ||
    filters.oddsAvailable ||
    filters.searchQuery.length > 0 ||
    selectedFavoriteTeamIds.length > 0;
  const isDefaultLiveView = !isLeagueMixedMode && filters.status === "live";

  const shouldLoadGlobalUpcomingFallback = shouldFetchGlobalUpcomingFallback({
    isLeagueMixedMode,
    status: filters.status,
    hasNarrowingFilters,
    isPrimaryLoading,
    hasPrimaryError: Boolean(primaryError),
    primaryVisibleCount: primaryFilteredGames.length,
  });

  const globalUpcomingFallbackFilters = useMemo<FiltersType>(
    () => ({
      ...filters,
      leagueID: [],
      status: "upcoming",
      teamID: undefined,
      from: undefined,
      to: undefined,
      limit: GLOBAL_UPCOMING_FALLBACK_LIMIT,
    }),
    [filters],
  );

  const {
    data: globalFallbackGames,
    isLoading: isGlobalFallbackLoading,
    error: globalFallbackError,
    refetch: refetchGlobalFallback,
    isFetching: isGlobalFallbackFetching,
    dataUpdatedAt: globalFallbackDataUpdatedAt,
  } = useGames(globalUpcomingFallbackFilters, {
    enabled: shouldLoadGlobalUpcomingFallback,
  });

  const globalFallbackFilteredGames = useMemo(
    () => applyFavoriteFilterAndSort(globalFallbackGames, selectedFavoriteTeamIds),
    [globalFallbackGames, selectedFavoriteTeamIds],
  );
  const isUsingGlobalUpcomingFallback = shouldLoadGlobalUpcomingFallback && globalFallbackFilteredGames.length > 0;
  const filteredGames = isUsingGlobalUpcomingFallback ? globalFallbackFilteredGames : primaryFilteredGames;
  const activeDataUpdatedAt = isUsingGlobalUpcomingFallback
    ? globalFallbackDataUpdatedAt
    : primaryDataUpdatedAt;

  const emptyStateVariant = deriveEmptyStateVariant({
    isLeagueMixedMode,
    isDefaultLiveView,
    hasNarrowingFilters,
  });

  const liveGamesCount = useMemo(
    () => filteredGames.filter((game) => game.status.started && !game.status.ended).length,
    [filteredGames],
  );
  const showLeagueUpcomingFallbackBanner =
    isLeagueMixedMode && filteredGames.length > 0 && liveGamesCount === 0;
  const showGlobalUpcomingFallbackBanner = isUsingGlobalUpcomingFallback;

  const clearFilters = () => {
    setFilters({
      leagueID: [],
      bookmakerID: [],
      betTypeID: [],
      status: "live",
      searchQuery: "",
      searchTeam: null,
      oddsAvailable: false,
    });
    setSelectedFavoriteTeamIds([]);
  };
  const showUpcoming = () => {
    setFilters((prev) => ({
      ...prev,
      status: "upcoming",
    }));
  };
  const handleFiltersChange = useCallback((nextFilters: FiltersType) => {
    setFilters((prev) => normalizeGamesFiltersOnLeagueChange(prev, nextFilters));
  }, []);
  const handleSelectSearchTeam = useCallback((team: {
    id: string;
    name: string;
    league: string;
    logoUrl?: string | null;
  }) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: team.name,
      searchTeam: {
        id: team.id,
        name: team.name,
        league: team.league,
        logoUrl: team.logoUrl || null,
      },
    }));
  }, []);
  const handleClearSearchTeam = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      searchTeam: null,
    }));
  }, []);

  const visibleEventIds = useMemo(() => buildVisibleEventIds(filteredGames, 12), [filteredGames]);
  const isLoading = isPrimaryLoading || (shouldLoadGlobalUpcomingFallback && isGlobalFallbackLoading);
  const isFetching =
    isPrimaryFetching || (shouldLoadGlobalUpcomingFallback && isGlobalFallbackFetching);
  const error = primaryError || (shouldLoadGlobalUpcomingFallback ? globalFallbackError : null);
  const refreshStatus = useMemo(
    () =>
      deriveRefreshStatus({
        isFetching,
        lastRefreshAtMs: activeDataUpdatedAt || null,
        nowMs: clockMs,
      }),
    [isFetching, activeDataUpdatedAt, clockMs],
  );
  const refreshGames = useCallback(() => {
    void refetchPrimary();
    if (shouldLoadGlobalUpcomingFallback) {
      void refetchGlobalFallback();
    }
  }, [refetchPrimary, refetchGlobalFallback, shouldLoadGlobalUpcomingFallback]);
  const handleStreamDiff = useCallback(() => {
    if (isFetching) {
      return;
    }
    void refetchPrimary();
    if (shouldLoadGlobalUpcomingFallback) {
      void refetchGlobalFallback();
    }
  }, [isFetching, refetchPrimary, refetchGlobalFallback, shouldLoadGlobalUpcomingFallback]);
  const { isConnected: streamConnected } = useGamesStream({
    eventIDs: visibleEventIds,
    enabled: !isLoading && !error && visibleEventIds.length > 0,
    onDiff: handleStreamDiff,
    minDiffRefetchMs: 4000,
  });

  return (
    <div className="min-h-screen bg-background relative">
      <PageGlow />
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">
                <span className="text-gradient-gold">Games</span>
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshGames}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 md:px-6 py-6">
        {/* Favorite Teams Filter */}
        {(favoriteTeams.length > 0 || favoritesLoading) && (
          <div className="mb-4">
            <FavoriteTeamsFilter
              favoriteTeams={favoriteTeams}
              selectedTeamIds={selectedFavoriteTeamIds}
              onToggleTeam={handleToggleFavoriteTeam}
              isLoading={favoritesLoading}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <GamesFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalResults={filteredGames.length}
            isLoading={isLoading}
            statusLocked={isLeagueMixedMode}
            statusHelperText={
              isLeagueMixedMode
                ? "League mode prioritizes live games and includes upcoming games within the next 3 days."
                : undefined
            }
            teamOptions={teamSuggestions}
            onSelectSearchTeam={handleSelectSearchTeam}
            onClearSearchTeam={handleClearSearchTeam}
          />
        </div>

        <div className="mb-4 min-h-[20px]">
          <p
            className={cn(
              "text-xs",
              refreshStatus.tone === "fresh" ? "text-green-600" : "text-yellow-600",
            )}
          >
            {refreshStatus.text}
          </p>
        </div>

        {/* Error state */}
        {error && !isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Failed to load games. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshGames}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {showLeagueUpcomingFallbackBanner && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-muted-foreground">
            No live games in this league right now. Showing upcoming games in the next 3 days.
          </div>
        )}
        {showGlobalUpcomingFallbackBanner && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-muted-foreground">
            No live games right now. Showing the next 25 upcoming games across all leagues.
          </div>
        )}

        {/* Games grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <EmptyGamesState
            variant={emptyStateVariant}
            onClearFilters={emptyStateVariant === "filtered" ? clearFilters : undefined}
            onShowUpcoming={emptyStateVariant === "globalNoLive" ? showUpcoming : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.eventID} game={game} />
            ))}
          </div>
        )}

        {/* Live data indicator */}
        {!isLoading && !error && filteredGames.length > 0 && (
          <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Live Data:</span> Showing {filteredGames.length} events from Tipoff backend.
              {streamConnected ? " Streaming is active for visible games." : " Polling fallback refreshes every minute."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Games;
