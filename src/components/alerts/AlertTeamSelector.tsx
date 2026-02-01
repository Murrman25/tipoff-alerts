import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameEvent } from "@/types/games";
import { TeamLogo } from "@/components/TeamLogo";

interface AlertTeamSelectorProps {
  game: GameEvent | null;
  value: "home" | "away" | null;
  onChange: (value: "home" | "away" | null) => void;
}

// Helper to safely get team name with fallbacks
const getTeamName = (team: any): string => {
  return team?.canonical?.displayName || team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown Team';
};

export const AlertTeamSelector = ({
  game,
  value,
  onChange,
}: AlertTeamSelectorProps) => {
  if (!game) {
    return (
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Team
        </label>
        <Select disabled>
          <SelectTrigger className="bg-secondary/50 border-border h-11 opacity-50">
            <SelectValue placeholder="Select event first" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Team
      </label>
      <Select
        value={value || ""}
        onValueChange={(v) => onChange(v as "home" | "away" | null)}
      >
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="home" className="py-2">
            <div className="flex items-center gap-2">
              <TeamLogo
                logoUrl={game.teams.home.logoUrl}
                teamName={getTeamName(game.teams.home)}
                size={20}
              />
              <span className="text-xs text-muted-foreground">HOME</span>
              <span className="font-medium">{getTeamName(game.teams.home)}</span>
            </div>
          </SelectItem>
          <SelectItem value="away" className="py-2">
            <div className="flex items-center gap-2">
              <TeamLogo
                logoUrl={game.teams.away.logoUrl}
                teamName={getTeamName(game.teams.away)}
                size={20}
              />
              <span className="text-xs text-muted-foreground">AWAY</span>
              <span className="font-medium">{getTeamName(game.teams.away)}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
