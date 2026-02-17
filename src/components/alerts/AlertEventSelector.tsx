import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { LEAGUES, LeagueID, GameEvent } from "@/types/games";
import { useGames } from "@/hooks/useGames";
import { useGameById } from "@/hooks/useGameById";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import { LeagueLogo } from "@/components/games/LeagueLogo";
import { FavoriteTeamsFilter } from "@/components/games/FavoriteTeamsFilter";
import { GameSelectCard } from "./GameSelectCard";
import { cn } from "@/lib/utils";
import { isRateLimitedError } from "@/lib/tipoffApi";
import { resolveCanonicalTeamIDs } from "@/lib/teamSearch";

interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null, game: GameEvent | null, isAutoSelect?: boolean) => void;
  preSelectedEventID?: string | null;
  preSelectedGame?: GameEvent | null;
}

const leagueFilters: { id: "all" | LeagueID; label: string }[] = [
  { id: "all", label: "All" },
  ...LEAGUES.map((l) => ({ id: l.id, label: l.name })),
];

export const AlertEventSelector = ({
  value,
  onChange,
  preSelectedEventID,
  preSelectedGame,
}: AlertEventSelectorProps) => {
  const [selectedLeague, setSelectedLeague] = useState<"all" | LeagueID>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [selectedFavoriteTeamIds, setSelectedFavoriteTeamIds] = useState<string[]>([]);

  // Fetch favorite teams
  const { allTeams, favoriteTeams, isLoading: favoritesLoading } = useFavoriteTeams();

  const resolvedTeamIDs = useMemo(
    () =>
      resolveCanonicalTeamIDs(searchQuery, allTeams, {
        leagueIDs: selectedLeague === "all" ? undefined : [selectedLeague],
        maxResults: 3,
      }),
    [allTeams, searchQuery, selectedLeague],
  );

  const teamSearchWindow = useMemo(() => {
    if (resolvedTeamIDs.length === 0) {
      return { from: undefined, to: undefined };
    }
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return { from, to };
  }, [resolvedTeamIDs]);

  const handleToggleFavoriteTeam = (teamId: string) => {
    setSelectedFavoriteTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Fetch games from API with selected league filter
  const { data: games, isLoading, error, refetch, isRefetching } = useGames({
    leagueID: selectedLeague === "all" ? [] : [selectedLeague],
    bookmakerID: [],
    betTypeID: [],
    status: "all",
    searchQuery,
    oddsAvailable: false,
    teamID: resolvedTeamIDs,
    from: teamSearchWindow.from,
    to: teamSearchWindow.to,
    limit: 25,
  });

  const effectivePreSelectedEventID = preSelectedEventID || preSelectedGame?.eventID || null;

  // Fetch specific game if pre-selected
  const { data: fetchedPreSelectedGame, isLoading: isLoadingPreSelected } = useGameById(
    effectivePreSelectedEventID && !preSelectedGame && !hasAutoSelected
      ? effectivePreSelectedEventID
      : null
  );

  // Effect to auto-select when a pre-selected game is available.
  useEffect(() => {
    if (hasAutoSelected) {
      return;
    }

    if (effectivePreSelectedEventID && preSelectedGame) {
      onChange(effectivePreSelectedEventID, preSelectedGame, true);
      setHasAutoSelected(true);
      return;
    }

    if (effectivePreSelectedEventID && fetchedPreSelectedGame) {
      onChange(effectivePreSelectedEventID, fetchedPreSelectedGame, true);
      setHasAutoSelected(true);
    }
  }, [
    effectivePreSelectedEventID,
    fetchedPreSelectedGame,
    hasAutoSelected,
    onChange,
    preSelectedGame,
  ]);

  // Combine pre-selected game with list (if not already present)
  const allGames = useMemo(() => {
    const gameList = [...(games || [])];
    const shouldIncludePreselectedFromState =
      !!preSelectedGame && (value === preSelectedGame.eventID || !hasAutoSelected);
    if (
      shouldIncludePreselectedFromState &&
      preSelectedGame &&
      !gameList.find(g => g.eventID === preSelectedGame.eventID)
    ) {
      gameList.unshift(preSelectedGame);
    }
    const shouldIncludeFetchedPreselected =
      !!fetchedPreSelectedGame && (value === fetchedPreSelectedGame.eventID || !hasAutoSelected);
    if (
      shouldIncludeFetchedPreselected &&
      fetchedPreSelectedGame &&
      !gameList.find(g => g.eventID === fetchedPreSelectedGame.eventID)
    ) {
      gameList.unshift(fetchedPreSelectedGame);
    }
    return gameList;
  }, [games, preSelectedGame, fetchedPreSelectedGame, value, hasAutoSelected]);

  // Client-side filtering (search + favorite teams)
  const filteredGames = useMemo(() => {
    let result = allGames;

    // Apply favorite teams filter
    if (selectedFavoriteTeamIds.length > 0) {
      result = result.filter((game) =>
        selectedFavoriteTeamIds.some(
          (teamId) =>
            game.teams.home.canonical?.id === teamId ||
            game.teams.away.canonical?.id === teamId
        )
      );
    }

    return result;
  }, [allGames, selectedFavoriteTeamIds]);

  const isLoadingAny = preSelectedGame ? isLoading : (isLoading || isLoadingPreSelected);
  const isRateLimited = isRateLimitedError(error);

  const handleSelect = (eventID: string) => {
    const selectedGame = filteredGames.find(g => g.eventID === eventID) || null;
    onChange(eventID, selectedGame, false); // User manually selected
  };

  return (
    <div className="space-y-4 flex-1">
      {/* League Filter Pills with Logos */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {leagueFilters.map((league) => (
          <Button
            key={league.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "h-9 px-3 text-xs font-medium rounded-lg transition-all shrink-0 gap-1.5",
              selectedLeague === league.id
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {league.id !== "all" && (
              <LeagueLogo leagueId={league.id} size={14} />
            )}
            <span>{league.id === "all" ? "All" : league.id}</span>
          </Button>
        ))}
      </div>

      {/* Favorite Teams Filter */}
      {(favoriteTeams.length > 0 || favoritesLoading) && (
        <FavoriteTeamsFilter
          favoriteTeams={favoriteTeams}
          selectedTeamIds={selectedFavoriteTeamIds}
          onToggleTeam={handleToggleFavoriteTeam}
          isLoading={favoritesLoading}
        />
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-secondary/50 border-border"
        />
      </div>

      {/* Game Cards */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
        {isLoadingAny ? (
          <div className="py-8 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading games...
          </div>
        ) : isRateLimited ? (
          <div className="py-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">API rate limit reached</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
              The sports data API is temporarily unavailable. Please wait a moment.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={cn("w-3 h-3", isRefetching && "animate-spin")} />
              {isRefetching ? "Retrying..." : "Try again"}
            </Button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground text-center">
            No games found
          </div>
        ) : (
          filteredGames.slice(0, 10).map((game) => (
            <GameSelectCard
              key={game.eventID}
              game={game}
              isSelected={value === game.eventID}
              onSelect={() => handleSelect(game.eventID)}
            />
          ))
        )}
      </div>

      {filteredGames.length > 10 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 10 of {filteredGames.length} games. Use search to find more.
        </p>
      )}
    </div>
  );
};
