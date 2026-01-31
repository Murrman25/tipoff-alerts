import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockGames } from "@/data/mockGames";

interface AlertTeamSelectorProps {
  eventID: string | null;
  value: "home" | "away" | null;
  onChange: (value: "home" | "away" | null) => void;
}

export const AlertTeamSelector = ({
  eventID,
  value,
  onChange,
}: AlertTeamSelectorProps) => {
  const selectedGame = eventID
    ? mockGames.find((g) => g.eventID === eventID)
    : null;

  if (!selectedGame) {
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
              <span className="text-xs text-muted-foreground">HOME</span>
              <span className="font-medium">{selectedGame.teams.home.name}</span>
            </div>
          </SelectItem>
          <SelectItem value="away" className="py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">AWAY</span>
              <span className="font-medium">{selectedGame.teams.away.name}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
