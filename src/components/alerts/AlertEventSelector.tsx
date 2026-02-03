import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { LEAGUES, LeagueID, GameEvent } from "@/types/games";
import { useGames } from "@/hooks/useGames";
import { useGameById } from "@/hooks/useGameById";
import { LeagueLogo } from "@/components/games/LeagueLogo";
import { GameSelectCard } from "./GameSelectCard";
import { cn } from "@/lib/utils";

interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null, game: GameEvent | null, isAutoSelect?: boolean) => void;
  preSelectedEventID?: string | null;
}

const leagueFilters: { id: "all" | LeagueID; label: string }[] = [
  { id: "all", label: "All" },
  ...LEAGUES.map((l) => ({ id: l.id, label: l.name })),
];

export const AlertEventSelector = ({
  value,
  onChange,
  preSelectedEventID,
}: AlertEventSelectorProps) => {
  const [selectedLeague, setSelectedLeague] = useState<"all" | LeagueID>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Fetch games from API with selected league filter
  const { data: games, isLoading } = useGames({
    leagueID: selectedLeague === "all" ? [] : [selectedLeague],
    bookmakerID: [],
    betTypeID: [],
    searchQuery: "",
    dateRange: "today",
    oddsAvailable: true,
  });

  // Fetch specific game if pre-selected
  const { data: preSelectedGame, isLoading: isLoadingPreSelected } = useGameById(
    preSelectedEventID && !hasAutoSelected ? preSelectedEventID : null
  );

  // Effect to auto-select when pre-selected game loads
  useEffect(() => {
    if (preSelectedEventID && preSelectedGame && !hasAutoSelected) {
      onChange(preSelectedEventID, preSelectedGame, true); // Mark as auto-select
      setHasAutoSelected(true);
    }
  }, [preSelectedGame, preSelectedEventID, hasAutoSelected, onChange]);

  // Combine pre-selected game with list (if not already present)
  const allGames = useMemo(() => {
    const gameList = [...(games || [])];
    if (preSelectedGame && !gameList.find(g => g.eventID === preSelectedGame.eventID)) {
      gameList.unshift(preSelectedGame);
    }
    return gameList;
  }, [games, preSelectedGame]);

  // Client-side search filtering
  const filteredGames = allGames.filter((game) => {
    const query = searchQuery.toLowerCase();
    const homeName = game.teams.home.name || game.teams.home.teamID || '';
    const awayName = game.teams.away.name || game.teams.away.teamID || '';
    const homeAbbr = game.teams.home.abbreviation || '';
    const awayAbbr = game.teams.away.abbreviation || '';
    
    return (
      query === "" ||
      homeName.toLowerCase().includes(query) ||
      awayName.toLowerCase().includes(query) ||
      homeAbbr.toLowerCase().includes(query) ||
      awayAbbr.toLowerCase().includes(query)
    );
  });

  const isLoadingAny = isLoading || isLoadingPreSelected;

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
