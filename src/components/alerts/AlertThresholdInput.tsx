import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MarketType, RuleType } from "@/types/alerts";

interface AlertThresholdInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  marketType: MarketType;
  ruleType?: RuleType;
  label?: string;
  placeholder?: string;
}

export const AlertThresholdInput = ({
  value,
  onChange,
  marketType,
  ruleType,
  label,
  placeholder,
}: AlertThresholdInputProps) => {
  // Track the display value separately for formatting
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Determine if this input needs +/- formatting
  const needsSignFormatting = marketType === "ml" || marketType === "sp";
  
  // Determine if decimals are allowed
  const allowDecimals = marketType === "sp" || marketType === "ou";
  
  // Check if this is a points-based input (score margin, momentum)
  const isPointsInput = ruleType === "score_margin" || ruleType === "momentum_run";

  // Format the value for display (with +/- prefix when applicable)
  const formatForDisplay = (val: number | null): string => {
    if (val === null) return "";
    
    if (needsSignFormatting) {
      // Add + prefix for positive values in ML and Spread
      if (val > 0) return `+${val}`;
      return val.toString();
    }
    
    return val.toString();
  };

  // Round to nearest .0 or .5
  const roundToHalf = (val: number): number => {
    return Math.round(val * 2) / 2;
  };

  // Parse the input value, stripping any leading +
  const parseInputValue = (input: string): number | null => {
    if (input === "" || input === "-" || input === "+") return null;
    
    // Remove leading + if present
    const cleanInput = input.replace(/^\+/, "");
    
    const parsed = parseFloat(cleanInput);
    if (isNaN(parsed)) return null;
    
    return parsed;
  };

  // Validate input based on market type
  const isValidInput = (input: string): boolean => {
    if (input === "" || input === "-" || input === "+") return true;
    
    // Remove leading + for validation
    const cleanInput = input.replace(/^\+/, "");
    
    if (isPointsInput) {
      // Points must be positive integers
      return /^\d+$/.test(cleanInput);
    }
    
    if (marketType === "ml") {
      // Moneyline: integers only (can be negative)
      return /^-?\d+$/.test(cleanInput);
    }
    
    if (marketType === "sp" || marketType === "ou") {
      // Spread and O/U: decimals allowed
      return /^-?\d*\.?\d*$/.test(cleanInput);
    }
    
    return true;
  };

  // Sync display value when external value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatForDisplay(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow typing in progress (like just "-" or ".")
    if (!isValidInput(inputValue)) return;
    
    setDisplayValue(inputValue);
    
    const parsed = parseInputValue(inputValue);
    onChange(parsed);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // On focus, show raw value without + prefix for easier editing
    if (value !== null) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Round decimal values to nearest .0 or .5 on blur
    if (allowDecimals && value !== null) {
      const rounded = roundToHalf(value);
      if (rounded !== value) {
        onChange(rounded);
      }
      setDisplayValue(formatForDisplay(rounded));
    } else {
      setDisplayValue(formatForDisplay(value));
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
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

  const getInputMode = (): "numeric" | "decimal" => {
    if (allowDecimals) return "decimal";
    return "numeric";
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        {label || "Threshold"}
      </label>
      <Input
        type="text"
        inputMode={getInputMode()}
        placeholder={getPlaceholder()}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="bg-secondary/50 border-border h-11 font-mono"
      />
    </div>
  );
};
