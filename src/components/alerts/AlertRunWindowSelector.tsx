import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RUN_WINDOW_OPTIONS } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface AlertRunWindowSelectorProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export const AlertRunWindowSelector = ({
  value,
  onChange,
}: AlertRunWindowSelectorProps) => {
  const [isCustom, setIsCustom] = useState(
    value !== undefined && !RUN_WINDOW_OPTIONS.some((opt) => opt.value === value)
  );
  const [customValue, setCustomValue] = useState(
    isCustom && value ? value.toString() : ""
  );

  const handlePresetClick = (presetValue: number) => {
    setIsCustom(false);
    setCustomValue("");
    onChange(presetValue);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);
    
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      onChange(parsed);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Track run within
      </label>
      <div className="flex flex-wrap gap-2">
        {RUN_WINDOW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handlePresetClick(option.value)}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "border border-border",
              !isCustom && value === option.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomClick}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "border border-border",
            isCustom
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/50 text-foreground hover:bg-secondary"
          )}
        >
          Custom
        </button>
      </div>
      {isCustom && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Input
            type="number"
            min={1}
            max={30}
            placeholder="Minutes"
            value={customValue}
            onChange={handleCustomChange}
            className="w-24 bg-secondary/50 border-border h-10 font-mono"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
      )}
    </div>
  );
};
