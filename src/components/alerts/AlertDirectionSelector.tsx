import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DirectionType, DIRECTION_OPTIONS, RuleType } from "@/types/alerts";

interface AlertDirectionSelectorProps {
  value: DirectionType;
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
    if (ruleType === "threshold_cross") {
      return DIRECTION_OPTIONS.filter(
        (opt) => opt.id === "crosses_above" || opt.id === "crosses_below"
      );
    }
    if (ruleType === "threshold_at") {
      return DIRECTION_OPTIONS.filter(
        (opt) =>
          opt.id === "at_or_above" ||
          opt.id === "at_or_below" ||
          opt.id === "exactly"
      );
    }
    return DIRECTION_OPTIONS;
  };

  const options = getAvailableOptions();

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Direction
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as DirectionType)}>
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
