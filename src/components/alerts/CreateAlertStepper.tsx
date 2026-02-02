import { ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface StepProps {
  stepNumber: number;
  title: string;
  isOpen: boolean;
  isComplete: boolean;
  summary?: string;
  onToggle: () => void;
  children: ReactNode;
}

export const AlertStep = ({
  stepNumber,
  title,
  isOpen,
  isComplete,
  summary,
  onToggle,
  children,
}: StepProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full py-3.5 px-4 rounded-xl",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen
              ? "bg-secondary/80 border border-border"
              : isComplete
              ? "bg-primary/5 hover:bg-primary/10 border border-primary/20"
              : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                "transition-all duration-200",
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isOpen
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="w-3.5 h-3.5" /> : stepNumber}
            </div>
            <div className="flex flex-col items-start">
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isComplete ? "text-primary" : isOpen ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {title}
              </span>
              {summary && !isOpen && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {summary}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-300 ease-out",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:animate-collapsible-up"
        )}
      >
        <div className="pt-4 pb-2 px-1 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface ProgressBarProps {
  steps: { isComplete: boolean }[];
}

const ProgressBar = ({ steps }: ProgressBarProps) => {
  const completedCount = steps.filter(s => s.isComplete).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {completedCount}/{steps.length}
      </span>
    </div>
  );
};

interface CreateAlertStepperProps {
  children: ReactNode;
  steps?: { isComplete: boolean }[];
}

export const CreateAlertStepper = ({ children, steps }: CreateAlertStepperProps) => {
  return (
    <div className="space-y-3">
      {steps && <ProgressBar steps={steps} />}
      {children}
    </div>
  );
};
