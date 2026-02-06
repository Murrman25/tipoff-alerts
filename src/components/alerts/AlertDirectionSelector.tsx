import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DirectionType, DIRECTION_OPTIONS, RuleType } from "@/types/alerts";

interface AlertDirectionSelectorProps {
  value: DirectionType | null;
  onChange: (value: DirectionType) => void;
  ruleType: RuleType;
}

export const AlertDirectionSelector = ({
  value,
  onChange,
  ruleType,
}: AlertDirectionSelectorProps) => {
  // Filter options based on rule type
  const getAvailableOptions = () => {
    // Market-based alerts use threshold directions
    if (ruleType === "ml_threshold" || ruleType === "spread_threshold" || ruleType === "ou_threshold") {
      return DIRECTION_OPTIONS.filter(
        (opt) =>
          opt.id === "at_or_above" ||
          opt.id === "at_or_below" ||
          opt.id === "crosses_above" ||
          opt.id === "crosses_below"
      );
    }
    // Score margin uses at/above/below
    if (ruleType === "score_margin") {
      return DIRECTION_OPTIONS.filter(
        (opt) =>
          opt.id === "at_or_above" ||
          opt.id === "at_or_below" ||
          opt.id === "exactly"
      );
    }
    // Surge and momentum don't need direction (handled by form validation)
    return DIRECTION_OPTIONS;
  };

  const options = getAvailableOptions();

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Direction
      </label>
      <Select value={value ?? ""} onValueChange={(v) => onChange(v as DirectionType)}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select direction" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="py-2">
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
