import { formatDistanceToNow } from "date-fns";
import { GameEvent, BookmakerID } from "@/types/games";
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

const formatOdds = (odds: string) => {
  const num = parseInt(odds);
  return num > 0 ? `+${num}` : `${num}`;
};

export const GameSelectCard = ({
  game,
  isSelected,
  onSelect,
}: GameSelectCardProps) => {
  const isLive = game.status.started && !game.status.ended;
  const hasScore = isLive && game.score;
  const startTime = new Date(game.status.startsAt);
  const isStartingSoon = !game.status.started && 
    startTime.getTime() - Date.now() <= 60 * 60 * 1000;

  // Odds extraction
  const getOddsValue = (oddID: string, bookmaker: BookmakerID = "draftkings") => {
    const oddData = game.odds[oddID];
    if (!oddData?.byBookmaker[bookmaker]) return null;
    return oddData.byBookmaker[bookmaker];
  };

  const homeML = getOddsValue("points-home-game-ml-home");
  const awayML = getOddsValue("points-away-game-ml-away");
  const homeSpread = getOddsValue("points-home-game-sp-home");
  const over = getOddsValue("points-all-game-ou-over");

  const hasOdds = awayML?.available || homeML?.available || homeSpread?.available || over?.available;

  // Helper to determine if a team is winning
  const isWinning = (teamScore: number, opponentScore: number) => teamScore > opponentScore;

  const getTimeLabel = () => {
    if (isLive) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE
          {game.status.period && (
            <span className="text-muted-foreground font-normal ml-1">
              {game.status.period} {game.status.clock}
            </span>
          )}
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
        "flex flex-col gap-1.5",
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

      {/* Teams with optional scores */}
      <div className="flex items-center justify-center gap-2 w-full py-1">
        {/* Away Team */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <div className="text-right">
            <span className="text-sm font-medium">{getTeamAbbr(game.teams.away)}</span>
            {hasScore && (
              <span className={cn(
                "ml-1.5 text-base font-bold tabular-nums",
                isWinning(game.score!.away, game.score!.home) && "text-primary"
              )}>
                {game.score!.away}
              </span>
            )}
          </div>
          <TeamLogo
            logoUrl={game.teams.away.logoUrl}
            teamName={getTeamName(game.teams.away)}
            size={28}
          />
        </div>

        {/* VS */}
        <span className="text-xs text-muted-foreground font-medium px-1">@</span>

        {/* Home Team */}
        <div className="flex items-center gap-1.5 flex-1">
          <TeamLogo
            logoUrl={game.teams.home.logoUrl}
            teamName={getTeamName(game.teams.home)}
            size={28}
          />
          <div className="text-left">
            {hasScore && (
              <span className={cn(
                "mr-1.5 text-base font-bold tabular-nums",
                isWinning(game.score!.home, game.score!.away) && "text-primary"
              )}>
                {game.score!.home}
              </span>
            )}
            <span className="text-sm font-medium">{getTeamAbbr(game.teams.home)}</span>
          </div>
        </div>
      </div>

      {/* Compact Odds Row */}
      {hasOdds && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-0.5">
          {(awayML?.available || homeML?.available) && (
            <span className="font-mono">
              ML: {awayML?.available ? formatOdds(awayML.odds) : '--'}/{homeML?.available ? formatOdds(homeML.odds) : '--'}
            </span>
          )}
          {homeSpread?.available && (
            <>
              <span className="text-border">•</span>
              <span className="font-mono">SP: {homeSpread.spread}</span>
            </>
          )}
          {over?.available && (
            <>
              <span className="text-border">•</span>
              <span className="font-mono">O/U: {over.overUnder}</span>
            </>
          )}
        </div>
      )}
    </button>
  );
};
