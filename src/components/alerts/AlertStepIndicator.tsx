import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "upcoming";

interface Step {
  id: number;
  label: string;
  status: StepStatus;
  summary?: string;
}

interface AlertStepIndicatorProps {
  steps: Step[];
  onStepClick?: (stepId: number) => void;
}

export const AlertStepIndicator = ({ steps, onStepClick }: AlertStepIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick?.(step.id)}
            disabled={step.status === "upcoming"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              step.status === "complete" && "bg-primary/10 hover:bg-primary/15 cursor-pointer",
              step.status === "current" && "bg-secondary border border-primary/30",
              step.status === "upcoming" && "bg-secondary/50 opacity-60 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0",
                step.status === "complete" && "bg-primary text-primary-foreground",
                step.status === "current" && "bg-primary/20 text-primary border border-primary/50",
                step.status === "upcoming" && "bg-muted text-muted-foreground"
              )}
            >
              {step.status === "complete" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                step.id
              )}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span
                className={cn(
                  "text-xs font-medium truncate",
                  step.status === "complete" && "text-primary",
                  step.status === "current" && "text-foreground",
                  step.status === "upcoming" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.summary && step.status === "complete" && (
                <span className="text-[10px] text-muted-foreground truncate max-w-full">
                  {step.summary}
                </span>
              )}
            </div>
          </button>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-4 h-0.5 shrink-0 mx-1",
                step.status === "complete" ? "bg-primary/50" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
