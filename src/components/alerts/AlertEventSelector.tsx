import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockGames } from "@/data/mockGames";
import { formatDistanceToNow } from "date-fns";

interface AlertEventSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const AlertEventSelector = ({
  value,
  onChange,
}: AlertEventSelectorProps) => {
  const formatEventLabel = (game: (typeof mockGames)[0]) => {
    const startTime = new Date(game.status.startsAt);
    const timeLabel = game.status.started
      ? "LIVE"
      : formatDistanceToNow(startTime, { addSuffix: true });
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
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Event
      </label>
      <Select
        value={value || ""}
        onValueChange={(v) => onChange(v || null)}
      >
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select a game" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-[300px]">
          {mockGames.map((game) => (
            <SelectItem key={game.eventID} value={game.eventID} className="py-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-xs border-border shrink-0"
                >
                  {game.leagueID}
                </Badge>
                <span className="font-medium">{formatEventLabel(game)}</span>
                <span
                  className={`text-xs ml-auto ${
                    game.status.started && !game.status.ended
                      ? "text-green-500 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {getTimeLabel(game)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
