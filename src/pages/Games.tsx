import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { GamesFilters } from "@/components/games/GamesFilters";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/games/GameCardSkeleton";
import { EmptyGamesState } from "@/components/games/EmptyGamesState";
import { GamesFilters as FiltersType } from "@/types/games";
import { mockGames } from "@/data/mockGames";
import { Button } from "@/components/ui/button";

const Games = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    leagueID: [],
    bookmakerID: [],
    betTypeID: [],
    searchQuery: "",
    dateRange: "today",
    oddsAvailable: true,
  });

  // Simulate filtering - in real app, this would be an API call
  const filteredGames = useMemo(() => {
    return mockGames.filter((game) => {
      // League filter
      if (
        filters.leagueID.length > 0 &&
        !filters.leagueID.includes(game.leagueID)
      ) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesHome = game.teams.home.name.toLowerCase().includes(query);
        const matchesAway = game.teams.away.name.toLowerCase().includes(query);
        if (!matchesHome && !matchesAway) {
          return false;
        }
      }

      // Date filter (simplified for mock data)
      // In real implementation, this would filter based on startsAt date

      return true;
    });
  }, [filters]);

  const hasActiveFilters =
    filters.leagueID.length > 0 ||
    filters.bookmakerID.length > 0 ||
    filters.betTypeID.length > 0 ||
    filters.searchQuery.length > 0;

  const clearFilters = () => {
    setFilters({
      leagueID: [],
      bookmakerID: [],
      betTypeID: [],
      searchQuery: "",
      dateRange: "today",
      oddsAvailable: true,
    });
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 md:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <GamesFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalResults={filteredGames.length}
            isLoading={isLoading}
          />
        </div>

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

        {/* API integration notice */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Mock Data:</span> This is
            a UI shell ready for backend integration with the SportsGameOdds
            API. Real-time data will include live odds, spreads, totals, and
            more from multiple sportsbooks.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Games;
