import { RuleType, RULE_TYPE_OPTIONS, PlanTier } from "@/types/alerts";
import { RuleTypeCard } from "./RuleTypeCard";

interface AlertRuleTypeSelectorProps {
  value: RuleType;
  onChange: (value: RuleType) => void;
  userTier?: PlanTier | "free"; // Accept "free" for backwards compatibility
}

// Helper to handle legacy tier values from database
const normalizeTier = (tier: string): PlanTier => {
  if (tier === "free") return "rookie";
  return tier as PlanTier;
};

export const AlertRuleTypeSelector = ({
  value,
  onChange,
  userTier = "free",
}: AlertRuleTypeSelectorProps) => {
  const tierOrder: PlanTier[] = ["rookie", "pro", "legend"];
  const normalizedUserTier = normalizeTier(userTier);

  const isLocked = (tier: PlanTier): boolean => {
    return tierOrder.indexOf(tier) > tierOrder.indexOf(normalizedUserTier);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Alert Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {RULE_TYPE_OPTIONS.map((option) => (
          <RuleTypeCard
            key={option.id}
            ruleType={option.id}
            name={option.name}
            description={option.description}
            planRequired={option.planRequired}
            isSelected={value === option.id}
            isLocked={isLocked(option.planRequired)}
            onSelect={() => {
              if (!isLocked(option.planRequired)) {
                onChange(option.id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
