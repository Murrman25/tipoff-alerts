import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketType, MARKET_OPTIONS } from "@/types/alerts";

interface AlertMarketSelectorProps {
  value: MarketType;
  onChange: (value: MarketType) => void;
}

export const AlertMarketSelector = ({
  value,
  onChange,
}: AlertMarketSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Market
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as MarketType)}>
        <SelectTrigger className="bg-secondary/50 border-border h-11">
          <SelectValue placeholder="Select market" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {MARKET_OPTIONS.map((option) => (
            <SelectItem key={option.id} value={option.id} className="py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {option.abbreviation}
                </span>
                <span>{option.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
