import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LEAGUES, LeagueID, GameEvent } from "@/types/games";
import { useGames } from "@/hooks/useGames";
import { cn } from "@/lib/utils";

interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null, game: GameEvent | null) => void;
}

const leagueFilters: { id: "all" | LeagueID; label: string }[] = [
  { id: "all", label: "All" },
  ...LEAGUES.map((l) => ({ id: l.id, label: l.name })),
];

export const AlertEventSelector = ({
  value,
  onChange,
}: AlertEventSelectorProps) => {
  const [selectedLeague, setSelectedLeague] = useState<"all" | LeagueID>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch games from API with selected league filter
  const { data: games, isLoading } = useGames({
    leagueID: selectedLeague === "all" ? [] : [selectedLeague],
    bookmakerID: [],
    betTypeID: [],
    searchQuery: "",
    dateRange: "today",
    oddsAvailable: true,
  });

  // Client-side search filtering
  const filteredGames = (games || []).filter((game) => {
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

  const formatEventLabel = (game: GameEvent) => {
    const awayAbbr = game.teams.away.abbreviation || game.teams.away.name?.slice(0, 3).toUpperCase() || 'AWY';
    const homeAbbr = game.teams.home.abbreviation || game.teams.home.name?.slice(0, 3).toUpperCase() || 'HME';
    return `${awayAbbr} @ ${homeAbbr}`;
  };

  const getTimeLabel = (game: GameEvent) => {
    if (game.status.started && !game.status.ended) {
      return "LIVE";
    }
    const startTime = new Date(game.status.startsAt);
    return formatDistanceToNow(startTime, { addSuffix: true });
  };

  const handleSelect = (eventID: string) => {
    const selectedGame = filteredGames.find(g => g.eventID === eventID) || null;
    onChange(eventID || null, selectedGame);
  };

  return (
    <div className="space-y-3 flex-1">
      {/* League Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {leagueFilters.map((league) => (
          <Button
            key={league.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "h-8 sm:h-7 px-3 sm:px-2.5 text-xs font-medium rounded-md transition-all shrink-0",
              selectedLeague === league.id
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {league.label}
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

      {/* Game Dropdown */}
      <Select value={value || ""} onValueChange={handleSelect}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder={isLoading ? "Loading games..." : "Select a game"} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-[300px]">
          {isLoading ? (
            <div className="py-4 px-3 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading games...
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="py-4 px-3 text-sm text-muted-foreground text-center">
              No games found
            </div>
          ) : (
            filteredGames.map((game) => (
              <SelectItem
                key={game.eventID}
                value={game.eventID}
                className="py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="text-xs border-border shrink-0"
                  >
                    {game.leagueID}
                  </Badge>
                  <span className="font-medium">{formatEventLabel(game)}</span>
                  <span
                    className={cn(
                      "text-xs ml-auto",
                      game.status.started && !game.status.ended
                        ? "text-green-500 font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {getTimeLabel(game)}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
