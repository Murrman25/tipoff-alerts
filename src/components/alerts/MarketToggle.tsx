import { MarketType, MARKET_OPTIONS } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface MarketToggleProps {
  value: MarketType;
  onChange: (value: MarketType) => void;
}

export const MarketToggle = ({ value, onChange }: MarketToggleProps) => {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Market
      </label>
      <div className="flex rounded-lg bg-muted/50 p-1 gap-1">
        {MARKET_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              value === option.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <span className="block text-xs font-semibold">{option.abbreviation}</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
              {option.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
