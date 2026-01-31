import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { GameEvent, LEAGUES, BookmakerID } from "@/types/games";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

// Team logos mapping - in real app, these would come from the API
import BullsLogo from "@/assets/teams/bulls.png";
import WarriorsLogo from "@/assets/teams/warriors.png";
import NuggetsLogo from "@/assets/teams/nuggets.png";
import CelticsLogo from "@/assets/teams/celtics.png";
import VikingsLogo from "@/assets/teams/vikings.png";
import CommandersLogo from "@/assets/teams/commanders.png";
import RangersLogo from "@/assets/teams/rangers.png";
import GiantsLogo from "@/assets/teams/giants.png";

const teamLogos: Record<string, string> = {
  bulls: BullsLogo,
  warriors: WarriorsLogo,
  nuggets: NuggetsLogo,
  celtics: CelticsLogo,
  vikings: VikingsLogo,
  commanders: CommandersLogo,
  rangers: RangersLogo,
  giants: GiantsLogo,
};

const getTeamLogo = (teamID: string): string => {
  const normalized = teamID.toLowerCase().replace(/[^a-z]/g, "");
  return teamLogos[normalized] || "/placeholder.svg";
};

// Helper to safely get team name with fallbacks
const getTeamName = (team: any): string => {
  return team?.name || team?.names?.long || team?.names?.medium || team?.teamID || 'Unknown Team';
};

const formatOdds = (odds: string) => {
  const num = parseInt(odds);
  return num > 0 ? `+${num}` : `${num}`;
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
  const league = LEAGUES.find((l) => l.id === game.leagueID);

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

  return (
    <div className="p-4 rounded-xl bg-card border border-border card-hover">
      {/* Header with league and status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {game.leagueID}
          </span>
        </div>
        {isLive ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-muted-foreground">
              {game.status.period} {game.status.clock}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {format(new Date(game.status.startsAt), "MMM d, h:mm a")}
          </span>
        )}
      </div>

      {/* Teams section */}
      <div className="space-y-3">
        {/* Away team row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={getTeamLogo(game.teams.away.teamID)}
              alt={getTeamName(game.teams.away)}
              className="w-8 h-8 object-contain"
            />
            <span className="font-medium truncate">{getTeamName(game.teams.away)}</span>
            {isLive && game.score && (
              <span className="text-lg font-bold ml-auto mr-4">
                {game.score.away}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Spread */}
            {awaySpread?.available && (
              <div className="text-right min-w-[60px]">
                <span className="text-xs text-muted-foreground block">
                  {awaySpread.spread}
                </span>
                <span className="font-mono text-sm">
                  {formatOdds(awaySpread.odds)}
                </span>
              </div>
            )}
            {/* Moneyline */}
            {awayML?.available && (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg min-w-[70px] text-center",
                  parseInt(awayML.odds) < 0
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

        {/* Home team row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={getTeamLogo(game.teams.home.teamID)}
              alt={getTeamName(game.teams.home)}
              className="w-8 h-8 object-contain"
            />
            <span className="font-medium truncate">{getTeamName(game.teams.home)}</span>
            {isLive && game.score && (
              <span className="text-lg font-bold ml-auto mr-4">
                {game.score.home}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Spread */}
            {homeSpread?.available && (
              <div className="text-right min-w-[60px]">
                <span className="text-xs text-muted-foreground block">
                  {homeSpread.spread}
                </span>
                <span className="font-mono text-sm">
                  {formatOdds(homeSpread.odds)}
                </span>
              </div>
            )}
            {/* Moneyline */}
            {homeML?.available && (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg min-w-[70px] text-center",
                  parseInt(homeML.odds) < 0
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
      {(over?.available || under?.available) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Total</span>
          <div className="flex items-center gap-2">
            {over?.available && (
              <div className="px-3 py-1 rounded-lg bg-secondary text-center">
                <span className="text-xs text-muted-foreground block">
                  O {over.overUnder}
                </span>
                <span className="font-mono text-sm">
                  {formatOdds(over.odds)}
                </span>
              </div>
            )}
            {under?.available && (
              <div className="px-3 py-1 rounded-lg bg-secondary text-center">
                <span className="text-xs text-muted-foreground block">
                  U {under.overUnder}
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
      <div className="mt-4 pt-3 border-t border-border/50">
        <Link to={`/alerts/create?eventID=${game.eventID}`}>
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </Link>
      </div>
    </div>
  );
};
