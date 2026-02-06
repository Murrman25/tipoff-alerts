import { Target, GitCompareArrows, ChartNoAxesCombined, Timer, Zap, Lock } from "lucide-react";
import { RuleType, PlanTier } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface RuleTypeCardProps {
  ruleType: RuleType;
  name: string;
  description?: string; // Optional, not used in compact mode
  planRequired: PlanTier;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

const ruleTypeIcons: Record<RuleType, React.ElementType> = {
  ml_threshold: Target,
  spread_threshold: GitCompareArrows,
  ou_threshold: ChartNoAxesCombined,
  score_margin: Target,
  timed_surge: Timer,
  momentum_run: Zap,
};

const tierLabels: Record<PlanTier, string> = {
  rookie: "Rookie",
  pro: "Pro",
  legend: "Legend",
};

export const RuleTypeCard = ({
  ruleType,
  name,
  planRequired,
  isSelected,
  isLocked,
  onSelect,
}: RuleTypeCardProps) => {
  const Icon = ruleTypeIcons[ruleType];
  const tierDisplay = tierLabels[planRequired];
  const tierColors = {
    rookie: { bg: "bg-secondary", text: "text-muted-foreground" },
    pro: { bg: "bg-amber-500/20", text: "text-amber-400" },
    legend: { bg: "bg-purple-500/20", text: "text-purple-400" },
  };
  const colors = tierColors[planRequired];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isLocked
          ? "opacity-50 cursor-not-allowed bg-muted/30 border-border"
          : isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Name */}
      <span className={cn(
        "text-xs font-medium",
        isSelected ? "text-foreground" : "text-foreground/80"
      )}>
        {name}
      </span>

      {/* Tier badge for locked items */}
      {isLocked && (
        <div className="flex items-center gap-1 ml-auto">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className={cn(
            "text-[9px] uppercase font-semibold px-1 py-0.5 rounded",
            colors.bg,
            colors.text
          )}>
            {tierDisplay}
          </span>
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && !isLocked && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shrink-0" />
      )}
    </button>
  );
};
