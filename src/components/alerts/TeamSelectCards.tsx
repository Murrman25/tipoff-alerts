import { GameEvent } from "@/types/games";
import { TeamLogo } from "@/components/TeamLogo";
import { cn } from "@/lib/utils";

interface TeamSelectCardsProps {
  game: GameEvent | null;
  value: "home" | "away" | null;
  onChange: (value: "home" | "away" | null) => void;
}

// Helper to safely get team name with fallbacks
const getTeamName = (team: any): string => {
  return team?.canonical?.displayName || team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown';
};

const getTeamAbbr = (team: any): string => {
  return team?.abbreviation || team?.name?.slice(0, 3).toUpperCase() || 'TM';
};

export const TeamSelectCards = ({
  game,
  value,
  onChange,
}: TeamSelectCardsProps) => {
  if (!game) {
    return (
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Team
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-20 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Select game first</span>
          </div>
          <div className="h-20 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Select game first</span>
          </div>
        </div>
      </div>
    );
  }

  const teams = [
    { side: "away" as const, team: game.teams.away, label: "AWAY" },
    { side: "home" as const, team: game.teams.home, label: "HOME" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Team
      </label>
      <div className="grid grid-cols-2 gap-2">
        {teams.map(({ side, team, label }) => (
          <button
            key={side}
            type="button"
            onClick={() => onChange(side)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "min-h-[80px]",
              value === side
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30"
            )}
          >
            <TeamLogo
              logoUrl={team.logoUrl}
              teamName={getTeamName(team)}
              size={28}
            />
            <span className="text-xs font-medium mt-1.5">{getTeamAbbr(team)}</span>
            <span className={cn(
              "text-[10px] uppercase tracking-wide mt-0.5",
              value === side ? "text-primary" : "text-muted-foreground"
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
