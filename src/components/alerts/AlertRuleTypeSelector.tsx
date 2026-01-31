import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RuleType, RULE_TYPE_OPTIONS, PlanTier } from "@/types/alerts";

interface AlertRuleTypeSelectorProps {
  value: RuleType;
  onChange: (value: RuleType) => void;
  userTier?: PlanTier;
}

const tierBadgeStyles: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-amber-gradient text-primary-foreground",
  legend: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
};

const tierLabels: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  legend: "Legend",
};

export const AlertRuleTypeSelector = ({
  value,
  onChange,
  userTier = "free",
}: AlertRuleTypeSelectorProps) => {
  const selectedOption = RULE_TYPE_OPTIONS.find((opt) => opt.id === value);

  const isDisabled = (tier: PlanTier): boolean => {
    const tierOrder: PlanTier[] = ["free", "pro", "legend"];
    return tierOrder.indexOf(tier) > tierOrder.indexOf(userTier);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Rule Type
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as RuleType)}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select a rule type" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {RULE_TYPE_OPTIONS.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id}
              disabled={isDisabled(option.planRequired)}
              className="py-3"
            >
              <div className="flex items-center gap-3">
                <span>{option.name}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${tierBadgeStyles[option.planRequired]}`}
                >
                  {tierLabels[option.planRequired]}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedOption && (
        <p className="text-sm text-muted-foreground">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
};
