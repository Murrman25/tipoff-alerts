import { Checkbox } from "@/components/ui/checkbox";
import { TimeWindow } from "@/types/alerts";

interface AlertTimeWindowProps {
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}

export const AlertTimeWindow = ({ value, onChange }: AlertTimeWindowProps) => {
  const handleLiveOnlyChange = (checked: boolean) => {
    onChange(checked ? "live" : "both");
  };

  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id="live-only"
        checked={value === "live"}
        onCheckedChange={handleLiveOnlyChange}
        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label
        htmlFor="live-only"
        className="text-sm font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        Live-only alert
      </label>
    </div>
  );
};
