import { AlertCondition, MARKET_OPTIONS, DIRECTION_OPTIONS } from "@/types/alerts";
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

  const generateSummary = (): string => {
    // Get team name
    const teamName = selectedGame && condition.teamSide
      ? (condition.teamSide === "home" 
          ? selectedGame.teams.home.name || selectedGame.teams.home.abbreviation 
          : selectedGame.teams.away.name || selectedGame.teams.away.abbreviation)
      : "[team]";

    // Get market name
    const market = MARKET_OPTIONS.find((m) => m.id === condition.marketType);
    const marketName = market?.name.toLowerCase() || "market";

    // Handle different rule types
    if (condition.ruleType === "arbitrage") {
      return "Alert me when an arbitrage opportunity is detected";
    }
    
    if (condition.ruleType === "best_available") {
      return `Alert me when ${teamName} has the best available ${marketName}`;
    }
    
    if (condition.ruleType === "value_change") {
      return `Alert me when any ${teamName} ${marketName} movement occurs`;
    }

    // Threshold-based rules
    const direction = DIRECTION_OPTIONS.find((d) => d.id === condition.direction);
    const thresholdFormatted = condition.threshold !== null
      ? (condition.threshold >= 0 ? `+${condition.threshold}` : condition.threshold.toString())
      : "[value]";

    if (condition.ruleType === "threshold_at") {
      const directionText = direction?.id === "at_or_above" ? "or better" : 
                           direction?.id === "at_or_below" ? "or lower" : 
                           direction?.id === "exactly" ? "exactly" : "";
      return `Alert me when ${teamName} ${marketName} reaches ${thresholdFormatted} ${directionText}`.trim();
    }

    if (condition.ruleType === "threshold_cross") {
      const crossDirection = direction?.id === "crosses_above" ? "crosses above" : 
                            direction?.id === "crosses_below" ? "crosses below" : "crosses";
      return `Alert me when ${teamName} ${marketName} ${crossDirection} ${thresholdFormatted}`;
    }

    if (condition.ruleType === "percentage_move") {
      return `Alert me when ${teamName} ${marketName} moves by ${thresholdFormatted}%`;
    }

    return `Alert me when ${teamName} ${marketName} reaches ${thresholdFormatted}`;
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
          className="w-5 h-5 object-contain"
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
