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
import { Search } from "lucide-react";
import { mockGames } from "@/data/mockGames";
import { formatDistanceToNow } from "date-fns";
import { LEAGUES, LeagueID } from "@/types/games";
import { cn } from "@/lib/utils";

interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
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

  const filteredGames = mockGames.filter((game) => {
    const matchesLeague =
      selectedLeague === "all" || game.leagueID === selectedLeague;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === "" ||
      game.teams.home.name.toLowerCase().includes(query) ||
      game.teams.away.name.toLowerCase().includes(query) ||
      game.teams.home.abbreviation?.toLowerCase().includes(query) ||
      game.teams.away.abbreviation?.toLowerCase().includes(query);
    return matchesLeague && matchesSearch;
  });

  const formatEventLabel = (game: (typeof mockGames)[0]) => {
    return `${game.teams.away.abbreviation} @ ${game.teams.home.abbreviation}`;
  };

  const getTimeLabel = (game: (typeof mockGames)[0]) => {
    if (game.status.started && !game.status.ended) {
      return "LIVE";
    }
    const startTime = new Date(game.status.startsAt);
    return formatDistanceToNow(startTime, { addSuffix: true });
  };

  return (
    <div className="space-y-3 flex-1">
      {/* League Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {leagueFilters.map((league) => (
          <Button
            key={league.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "h-7 px-2.5 text-xs font-medium rounded-md transition-all",
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
      <Select value={value || ""} onValueChange={(v) => onChange(v || null)}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select a game" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-[300px]">
          {filteredGames.length === 0 ? (
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
