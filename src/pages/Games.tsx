import { useState, useMemo } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { GamesFilters } from "@/components/games/GamesFilters";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { EmptyGamesState } from "@/components/games/EmptyGamesState";
import { FavoriteTeamsFilter } from "@/components/games/FavoriteTeamsFilter";
import { GamesFilters as FiltersType } from "@/types/games";
import { useGames } from "@/hooks/useGames";
import { useFavoriteTeams } from "@/hooks/useFavoriteTeams";
import { Button } from "@/components/ui/button";

const Games = () => {
  const [filters, setFilters] = useState<FiltersType>({
    leagueID: [],
    bookmakerID: [],
    betTypeID: [],
    searchQuery: "",
    dateRange: "today",
    oddsAvailable: true,
  });
  const [selectedFavoriteTeamIds, setSelectedFavoriteTeamIds] = useState<string[]>([]);

  // Fetch favorite teams
  const { favoriteTeams, isLoading: favoritesLoading } = useFavoriteTeams();

  // Fetch games from the API
  const { data: games, isLoading, error, refetch, isFetching } = useGames(filters);

  const handleToggleFavoriteTeam = (teamId: string) => {
    setSelectedFavoriteTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Client-side filtering (search + favorite teams)
  const filteredGames = useMemo(() => {
    if (!games) return [];
    
    let result = games;
    
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
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((game) => {
        const homeName = game.teams.home.name || game.teams.home.teamID || '';
        const awayName = game.teams.away.name || game.teams.away.teamID || '';
        const matchesHome = homeName.toLowerCase().includes(query);
        const matchesAway = awayName.toLowerCase().includes(query);
        return matchesHome || matchesAway;
      });
    }
    
    // Sort: live games first, then by start time
    return result.sort((a, b) => {
      const aLive = a.status.started && !a.status.ended;
      const bLive = b.status.started && !b.status.ended;
      
      // Live games first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      
      // Then by start time
      return new Date(a.status.startsAt).getTime() - new Date(b.status.startsAt).getTime();
    });
  }, [games, filters.searchQuery, selectedFavoriteTeamIds]);

  const hasActiveFilters =
    filters.leagueID.length > 0 ||
    filters.bookmakerID.length > 0 ||
    filters.betTypeID.length > 0 ||
    filters.searchQuery.length > 0 ||
    selectedFavoriteTeamIds.length > 0;

  const clearFilters = () => {
    setFilters({
      leagueID: [],
      bookmakerID: [],
      betTypeID: [],
      searchQuery: "",
      dateRange: "today",
      oddsAvailable: true,
    });
    setSelectedFavoriteTeamIds([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <span className="text-gradient-amber">Games</span>
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
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
            onFiltersChange={setFilters}
            totalResults={filteredGames.length}
            isLoading={isLoading}
          />
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
              onClick={() => refetch()}
              className="mt-2"
            >
              Retry
            </Button>
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
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.eventID} game={game} />
            ))}
          </div>
        )}

        {/* Live data indicator */}
        {!isLoading && !error && games && games.length > 0 && (
          <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Live Data:</span> Showing {games.length} events from SportsGameOdds API. Data refreshes automatically every minute.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Games;
