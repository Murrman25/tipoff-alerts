import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { GameEvent, LEAGUES, BookmakerID } from "@/types/games";
import { cn } from "@/lib/utils";
import { format, differenceInMinutes, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui/badge";
import { LeagueLogo } from "./LeagueLogo";
import { formatLiveStatusDisplay } from "@/lib/liveStatusDisplay";

// Helper to safely get team name with fallbacks
const getTeamName = (team: any): string => {
  return team?.canonical?.displayName || team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown Team';
};

const formatOdds = (odds?: string) => {
  if (!odds) {
    return "--";
  }
  const num = parseInt(odds);
  if (!Number.isFinite(num)) {
    return odds;
  }
  return num > 0 ? `+${num}` : `${num}`;
};

// Format relative time for upcoming games
const formatGameTime = (startsAt: string): string => {
  const date = new Date(startsAt);
  const timeStr = format(date, "h:mm a");
  
  if (isToday(date)) {
    return `Today ${timeStr}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow ${timeStr}`;
  }
  return format(date, "MMM d, h:mm a");
};

// Check if game is starting soon (within 60 minutes)
const isStartingSoon = (startsAt: string): boolean => {
  const now = new Date();
  const start = new Date(startsAt);
  const minutes = differenceInMinutes(start, now);
  return minutes > 0 && minutes <= 60;
};

// Get minutes until start
const getMinutesUntilStart = (startsAt: string): number => {
  return differenceInMinutes(new Date(startsAt), new Date());
};

interface GameCardProps {
  game: GameEvent;
  preferredBookmaker?: BookmakerID;
}

export const GameCard = ({
  game,
  preferredBookmaker = "draftkings",
}: GameCardProps) => {
  const isLive = game.status.started && !game.status.ended;
  const hasScore = isLive && game.score;
  const liveStatusLabel = formatLiveStatusDisplay({
    leagueID: game.leagueID,
    period: game.status.period,
    clock: game.status.clock,
  });
  const startingSoon = !isLive && isStartingSoon(game.status.startsAt);
  const minutesUntil = startingSoon ? getMinutesUntilStart(game.status.startsAt) : 0;
  
  // Helper to determine if a team is winning
  const isWinning = (teamScore: number, opponentScore: number) => teamScore > opponentScore;

  // Extract odds for display
  const homeMLKey = `points-home-game-ml-home`;
  const awayMLKey = `points-away-game-ml-away`;
  const homeSpreadKey = `points-home-game-sp-home`;
  const awaySpreadKey = `points-away-game-sp-away`;
  const overKey = `points-all-game-ou-over`;
  const underKey = `points-all-game-ou-under`;

  const getOddsValue = (oddID: string, bookmaker: BookmakerID) => {
    const oddData = game.odds[oddID];
    if (!oddData?.byBookmaker[bookmaker]) return null;
    return oddData.byBookmaker[bookmaker];
  };

  const homeML = getOddsValue(homeMLKey, preferredBookmaker);
  const awayML = getOddsValue(awayMLKey, preferredBookmaker);
  const homeSpread = getOddsValue(homeSpreadKey, preferredBookmaker);
  const awaySpread = getOddsValue(awaySpreadKey, preferredBookmaker);
  const over = getOddsValue(overKey, preferredBookmaker);
  const under = getOddsValue(underKey, preferredBookmaker);
  const hasStaleOdds = [homeML, awayML, homeSpread, awaySpread, over, under].some((quote) => quote?.stale);

  // Card styling based on state
  const cardClasses = cn(
    "p-5 rounded-xl bg-card border border-border transition-all duration-300",
    isLive && "live-card-glow",
    startingSoon && "starting-soon-border",
    !isLive && !startingSoon && "card-hover"
  );

  return (
    <div className={cardClasses}>
      {/* Header with league and status */}
      <div className="flex items-center justify-between mb-5">
        <Badge variant="secondary" className="gap-1.5 text-xs font-medium uppercase tracking-wide pr-2">
          <LeagueLogo leagueId={game.leagueID} size={16} />
          {game.leagueID}
        </Badge>
        
        {isLive ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1.5" />
              LIVE
            </Badge>
            {hasStaleOdds && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/40">
                STALE ODDS
              </Badge>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {liveStatusLabel}
            </span>
          </div>
        ) : startingSoon ? (
          <Badge variant="outline" className="text-primary border-primary/30">
            Starting in {minutesUntil}m
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatGameTime(game.status.startsAt)}
          </span>
        )}
      </div>

      {/* Teams section */}
      <div className="space-y-4">
        {/* Away team row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamLogo
              logoUrl={game.teams.away.logoUrl}
              teamName={getTeamName(game.teams.away)}
              size={40}
            />
            <span className="font-medium truncate text-base">{getTeamName(game.teams.away)}</span>
          </div>
          
          {/* Score column - only visible for live games */}
          {hasScore && (
            <span className={cn(
              "text-2xl font-bold tabular-nums min-w-[40px] text-center mx-4",
              isWinning(game.score!.away, game.score!.home) && "text-primary"
            )}>
              {game.score!.away}
            </span>
          )}
          
          <div className="flex items-center gap-2">
            {/* Spread */}
            {(awaySpread?.available || awaySpread?.stale) && (
              <div className="text-right min-w-[60px]">
                <span className={cn("text-xs block", awaySpread?.stale ? "text-amber-500" : "text-muted-foreground")}>
                  {awaySpread.spread || "—"}
                </span>
                <span className={cn("font-mono text-sm", awaySpread?.stale && "text-amber-500")}>
                  {formatOdds(awaySpread.odds)}
                </span>
              </div>
            )}
            {/* Moneyline */}
            {(awayML?.available || awayML?.stale) && (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg min-w-[70px] text-center",
                  awayML?.stale
                    ? "bg-amber-500/10 text-amber-500"
                    : parseInt(awayML?.odds || "0", 10) < 0
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary"
                )}
              >
                <span className="font-mono text-sm font-semibold">
                  {formatOdds(awayML.odds)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Separator between teams */}
        <div className="border-t border-border/30" />

        {/* Home team row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamLogo
              logoUrl={game.teams.home.logoUrl}
              teamName={getTeamName(game.teams.home)}
              size={40}
            />
            <span className="font-medium truncate text-base">{getTeamName(game.teams.home)}</span>
          </div>
          
          {/* Score column - only visible for live games */}
          {hasScore && (
            <span className={cn(
              "text-2xl font-bold tabular-nums min-w-[40px] text-center mx-4",
              isWinning(game.score!.home, game.score!.away) && "text-primary"
            )}>
              {game.score!.home}
            </span>
          )}
          
          <div className="flex items-center gap-2">
            {/* Spread */}
            {(homeSpread?.available || homeSpread?.stale) && (
              <div className="text-right min-w-[60px]">
                <span className={cn("text-xs block", homeSpread?.stale ? "text-amber-500" : "text-muted-foreground")}>
                  {homeSpread.spread || "—"}
                </span>
                <span className={cn("font-mono text-sm", homeSpread?.stale && "text-amber-500")}>
                  {formatOdds(homeSpread.odds)}
                </span>
              </div>
            )}
            {/* Moneyline */}
            {(homeML?.available || homeML?.stale) && (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg min-w-[70px] text-center",
                  homeML?.stale
                    ? "bg-amber-500/10 text-amber-500"
                    : parseInt(homeML?.odds || "0", 10) < 0
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary"
                )}
              >
                <span className="font-mono text-sm font-semibold">
                  {formatOdds(homeML.odds)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Over/Under row */}
      {(over?.available || over?.stale || under?.available || under?.stale) && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
          <span className="text-sm text-muted-foreground font-medium">Total</span>
          <div className="flex items-center gap-2">
            {(over?.available || over?.stale) && (
              <div className={cn("px-3 py-1.5 rounded-lg text-center", over?.stale ? "bg-amber-500/10 text-amber-500" : "bg-secondary")}>
                <span className={cn("text-xs block", over?.stale ? "text-amber-500" : "text-muted-foreground")}>
                  O {over.overUnder || "—"}
                </span>
                <span className="font-mono text-sm">
                  {formatOdds(over.odds)}
                </span>
              </div>
            )}
            {(under?.available || under?.stale) && (
              <div className={cn("px-3 py-1.5 rounded-lg text-center", under?.stale ? "bg-amber-500/10 text-amber-500" : "bg-secondary")}>
                <span className={cn("text-xs block", under?.stale ? "text-amber-500" : "text-muted-foreground")}>
                  U {under.overUnder || "—"}
                </span>
                <span className="font-mono text-sm">
                  {formatOdds(under.odds)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Alert Button */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <Link
          to={`/alerts/create?eventID=${game.eventID}`}
          state={{ preSelectedGame: game }}
        >
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </Link>
      </div>
    </div>
  );
};
