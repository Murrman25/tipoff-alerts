import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GamePeriod, SPORT_PERIODS } from "@/types/alerts";
import { SportID } from "@/types/games";

interface AlertGamePeriodSelectorProps {
  value: GamePeriod | undefined;
  onChange: (value: GamePeriod) => void;
  sportID: SportID | undefined;
}

export const AlertGamePeriodSelector = ({
  value,
  onChange,
  sportID,
}: AlertGamePeriodSelectorProps) => {
  // Default to basketball periods if sport is unknown
  const periods = sportID ? SPORT_PERIODS[sportID] : SPORT_PERIODS.BASKETBALL;

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Game Period
      </label>
      <Select value={value || 'full_game'} onValueChange={(v) => onChange(v as GamePeriod)}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              {period.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
