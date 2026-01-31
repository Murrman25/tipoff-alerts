import { Input } from "@/components/ui/input";
import { MarketType } from "@/types/alerts";

interface AlertThresholdInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  marketType: MarketType;
}

export const AlertThresholdInput = ({
  value,
  onChange,
  marketType,
}: AlertThresholdInputProps) => {
  const getPlaceholder = () => {
    switch (marketType) {
      case "ml":
        return "+150 or -110";
      case "sp":
        return "+3.5 or -7";
      case "ou":
        return "224.5";
      default:
        return "Enter value";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "" || inputValue === "-" || inputValue === "+") {
      onChange(null);
      return;
    }
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        Threshold
      </label>
      <Input
        type="text"
        inputMode="decimal"
        placeholder={getPlaceholder()}
        value={value !== null ? value.toString() : ""}
        onChange={handleChange}
        className="bg-secondary/50 border-border h-11 font-mono"
      />
    </div>
  );
};
