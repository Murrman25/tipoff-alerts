import { formatDistanceToNow } from "date-fns";
import { GameEvent } from "@/types/games";
import { TeamLogo } from "@/components/TeamLogo";
import { LeagueLogo } from "@/components/games/LeagueLogo";
import { cn } from "@/lib/utils";

interface GameSelectCardProps {
  game: GameEvent;
  isSelected: boolean;
  onSelect: () => void;
}

// Helper to safely get team name with fallbacks
const getTeamName = (team: any): string => {
  return team?.canonical?.displayName || team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown Team';
};

const getTeamAbbr = (team: any): string => {
  return team?.abbreviation || team?.name?.slice(0, 3).toUpperCase() || 'TM';
};

export const GameSelectCard = ({
  game,
  isSelected,
  onSelect,
}: GameSelectCardProps) => {
  const isLive = game.status.started && !game.status.ended;
  const startTime = new Date(game.status.startsAt);
  const isStartingSoon = !game.status.started && 
    startTime.getTime() - Date.now() <= 60 * 60 * 1000;

  const getTimeLabel = () => {
    if (isLive) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE
        </span>
      );
    }
    if (isStartingSoon) {
      return (
        <span className="text-xs text-primary font-medium">
          {formatDistanceToNow(startTime, { addSuffix: false })}
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(startTime, { addSuffix: true })}
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border transition-all duration-200",
        "flex flex-col gap-2",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30",
        isLive && !isSelected && "border-green-500/30"
      )}
    >
      {/* Top row: League + Time */}
      <div className="flex items-center justify-between w-full">
        <LeagueLogo leagueId={game.leagueID} size={16} />
        {getTimeLabel()}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">AWAY</span>
            <span className="text-sm font-medium">{getTeamAbbr(game.teams.away)}</span>
          </div>
          <TeamLogo
            logoUrl={game.teams.away.logoUrl}
            teamName={getTeamName(game.teams.away)}
            size={32}
          />
        </div>

        {/* VS */}
        <span className="text-xs text-muted-foreground font-medium px-2">@</span>

        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo
            logoUrl={game.teams.home.logoUrl}
            teamName={getTeamName(game.teams.home)}
            size={32}
          />
          <div className="text-left">
            <span className="text-xs text-muted-foreground block">HOME</span>
            <span className="text-sm font-medium">{getTeamAbbr(game.teams.home)}</span>
          </div>
        </div>
      </div>

      {/* Full team names */}
      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
        <span className="truncate flex-1 text-right pr-4">{getTeamName(game.teams.away)}</span>
        <span className="truncate flex-1 text-left pl-4">{getTeamName(game.teams.home)}</span>
      </div>
    </button>
  );
};
