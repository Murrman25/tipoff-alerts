import { AlertCondition, MARKET_OPTIONS, DIRECTION_OPTIONS, SPORT_PERIODS, GamePeriod } from "@/types/alerts";
import { GameEvent } from "@/types/games";
import { NotificationChannel } from "./AlertNotificationChannels";
import { cn } from "@/lib/utils";
import tipoffIcon from "@/assets/tipoff-logo-icon.png";

interface AlertSummaryProps {
  condition: AlertCondition;
  selectedGame: GameEvent | null;
  notificationChannels: NotificationChannel[];
  isVisible: boolean;
}

export const AlertSummary = ({ condition, selectedGame, notificationChannels, isVisible }: AlertSummaryProps) => {
  if (!isVisible) return null;

  const getTeamName = (): string => {
    if (!selectedGame || !condition.teamSide) return "[team]";
    return condition.teamSide === "home" 
      ? selectedGame.teams.home.name || selectedGame.teams.home.abbreviation || "Home"
      : selectedGame.teams.away.name || selectedGame.teams.away.abbreviation || "Away";
  };

  const getMarketName = (): string => {
    const market = MARKET_OPTIONS.find((m) => m.id === condition.marketType);
    return market?.name.toLowerCase() || "market";
  };

  const getDirectionText = (context: 'odds' | 'spread' | 'total' | 'margin'): string => {
    const direction = DIRECTION_OPTIONS.find((d) => d.id === condition.direction);
    if (!direction) return "";
    
    switch (context) {
      case 'odds':
        return direction.id === "at_or_above" ? "or better" : 
               direction.id === "at_or_below" ? "or worse" : "";
      case 'spread':
        return direction.id === "at_or_above" ? "or better" : 
               direction.id === "at_or_below" ? "or worse" : "";
      case 'total':
        return direction.id === "at_or_above" ? "or higher" : 
               direction.id === "at_or_below" ? "or lower" : "";
      case 'margin':
        return direction.id === "at_or_above" ? "or more" : 
               direction.id === "at_or_below" ? "or fewer" : 
               direction.id === "exactly" ? "exactly" : "";
      default:
        return "";
    }
  };

  const formatThreshold = (): string => {
    if (condition.threshold === null) return "[value]";
    return condition.threshold >= 0 ? `+${condition.threshold}` : condition.threshold.toString();
  };

  const getPeriodName = (): string => {
    if (!condition.gamePeriod || !selectedGame) return "";
    const periods = SPORT_PERIODS[selectedGame.sportID] || SPORT_PERIODS.BASKETBALL;
    const period = periods.find((p) => p.id === condition.gamePeriod);
    return period ? ` during ${period.name.toLowerCase()}` : "";
  };

  const generateSummary = (): string => {
    const teamName = getTeamName();
    const thresholdFormatted = formatThreshold();

    switch (condition.ruleType) {
      case "ml_threshold":
        return `Alert me when ${teamName} moneyline reaches ${thresholdFormatted} ${getDirectionText('odds')}`.trim();
      
      case "spread_threshold":
        return `Alert me when ${teamName} spread reaches ${thresholdFormatted} ${getDirectionText('spread')}`.trim();
      
      case "ou_threshold":
        return `Alert me when total reaches ${thresholdFormatted} ${getDirectionText('total')}`.trim();
      
      case "score_margin":
        return `Alert me when ${teamName} leads by ${thresholdFormatted} points ${getDirectionText('margin')}${getPeriodName()}`.trim();
      
      case "timed_surge": {
        const marketName = getMarketName();
        const windowText = condition.surgeWindowMinutes ? ` within ${condition.surgeWindowMinutes} minutes` : "";
        return `Alert me when ${teamName} ${marketName} line surges aggressively${windowText}${getPeriodName()}`.trim();
      }
      
      case "momentum_run": {
        const windowText = condition.runWindowMinutes ? ` within ${condition.runWindowMinutes} minutes` : "";
        const runSize = condition.threshold !== null ? condition.threshold : "X";
        return `Alert me when ${teamName} goes on a ${runSize}-0 run${windowText}${getPeriodName()}`.trim();
      }
      
      default:
        return `Alert me when ${teamName} ${getMarketName()} reaches ${thresholdFormatted}`;
    }
  };

  const getNotificationSuffix = (): string => {
    if (notificationChannels.length === 0) return "";
    
    const channelNames = notificationChannels.map(c => 
      c === "email" ? "email" : c === "push" ? "push" : "SMS"
    );

    if (channelNames.length === 1) {
      return `, via ${channelNames[0]}`;
    }
    
    if (channelNames.length === 2) {
      return `, via ${channelNames[0]} and ${channelNames[1]}`;
    }
    
    const last = channelNames.pop();
    return `, via ${channelNames.join(", ")}, and ${last}`;
  };

  const summary = generateSummary() + getNotificationSuffix();

  return (
    <div 
      className={cn(
        "bg-amber-500/5 border border-amber-500/30 rounded-lg p-4",
        "shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]",
        "animate-fade-in"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <img 
          src={tipoffIcon} 
          alt="TipOff" 
          className="w-5 h-5 object-contain animate-[pulse_2s_ease-in-out_infinite]"
        />
        <p className="text-xs uppercase tracking-wide text-amber-500 font-medium">
          Ready to create
        </p>
      </div>
      <p className="text-sm text-foreground">
        "{summary}"
      </p>
    </div>
  );
};
