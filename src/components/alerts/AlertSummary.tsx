import { AlertCondition, MARKET_OPTIONS, DIRECTION_OPTIONS, RULE_TYPE_OPTIONS } from "@/types/alerts";
import { mockGames } from "@/data/mockGames";

interface AlertSummaryProps {
  condition: AlertCondition;
}

export const AlertSummary = ({ condition }: AlertSummaryProps) => {
  const generateSummary = (): string => {
    const parts: string[] = ["Alert me when"];

    // Get team name
    const game = condition.eventID
      ? mockGames.find((g) => g.eventID === condition.eventID)
      : null;
    
    if (game && condition.teamSide) {
      const team = condition.teamSide === "home" ? game.teams.home : game.teams.away;
      parts.push(team.name);
    } else {
      parts.push("[select team]");
    }

    // Get market name
    const market = MARKET_OPTIONS.find((m) => m.id === condition.marketType);
    parts.push(market?.name.toLowerCase() || "market");

    // Get direction
    const direction = DIRECTION_OPTIONS.find((d) => d.id === condition.direction);
    const ruleType = RULE_TYPE_OPTIONS.find((r) => r.id === condition.ruleType);

    if (condition.ruleType === "value_change") {
      parts.push("changes");
    } else if (condition.ruleType === "arbitrage") {
      return "Alert me when an arbitrage opportunity is detected";
    } else if (condition.ruleType === "best_available") {
      return `Alert me when ${game && condition.teamSide 
        ? (condition.teamSide === "home" ? game.teams.home.name : game.teams.away.name)
        : "[team]"
      } has the best available ${market?.name.toLowerCase() || "line"}`;
    } else {
      if (direction) {
        const directionText = direction.name.toLowerCase();
        if (condition.threshold !== null) {
          const thresholdFormatted = condition.marketType === "ml"
            ? (condition.threshold >= 0 ? `+${condition.threshold}` : condition.threshold.toString())
            : (condition.threshold >= 0 ? `+${condition.threshold}` : condition.threshold.toString());
          parts.push(`reaches ${thresholdFormatted} or ${directionText.replace("at or ", "").replace("crosses ", "")}`);
        } else {
          parts.push(`is ${directionText} [threshold]`);
        }
      }
    }

    // Add time window
    if (condition.timeWindow === "live") {
      parts.push("(live only)");
    }

    return parts.join(" ");
  };

  const summary = generateSummary();
  const isComplete =
    condition.eventID !== null &&
    condition.teamSide !== null &&
    (condition.threshold !== null ||
      condition.ruleType === "value_change" ||
      condition.ruleType === "arbitrage" ||
      condition.ruleType === "best_available");

  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
        Alert Preview
      </p>
      <p
        className={`text-sm ${
          isComplete ? "text-foreground" : "text-muted-foreground italic"
        }`}
      >
        "{summary}"
      </p>
    </div>
  );
};
