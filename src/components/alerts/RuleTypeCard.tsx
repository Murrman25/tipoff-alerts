import { Target, GitCompareArrows, ChartNoAxesCombined, Timer, Zap, Lock } from "lucide-react";
import { RuleType, PlanTier } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface RuleTypeCardProps {
  ruleType: RuleType;
  name: string;
  description: string;
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
  description,
  planRequired,
  isSelected,
  isLocked,
  onSelect,
}: RuleTypeCardProps) => {
  const Icon = ruleTypeIcons[ruleType];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      className={cn(
        "relative flex flex-col items-start p-3 rounded-lg border transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-left min-h-[88px]",
        isLocked
          ? "opacity-50 cursor-not-allowed bg-muted/30 border-border"
          : isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30"
      )}
    >
      {/* Lock indicator for premium tiers */}
      {isLocked && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] uppercase font-medium text-muted-foreground">
            {tierLabels[planRequired]}
          </span>
        </div>
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className={cn(
          "text-sm font-medium",
          isSelected ? "text-foreground" : "text-foreground/80"
        )}>
          {name}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Selected indicator */}
      {isSelected && !isLocked && (
        <div className="absolute bottom-2 right-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      )}
    </button>
  );
};
