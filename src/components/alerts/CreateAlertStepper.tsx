import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
            "flex items-center justify-between w-full p-3 rounded-lg",
            "transition-all duration-200 ease-out",
            "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen
              ? "border-primary/30 bg-secondary"
              : isComplete
              ? "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:scale-[1.01]"
              : "border-border bg-secondary/50 hover:bg-secondary"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                "transition-all duration-200",
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isOpen
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? "✓" : stepNumber}
            </div>
            <div className="flex flex-col items-start">
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isComplete ? "text-primary" : "text-foreground"
                )}
              >
                {title}
              </span>
              {summary && !isOpen && (
                <span className="text-xs text-muted-foreground animate-fade-in">
                  {summary}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300 ease-out",
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
        <div className="pt-4 pb-2 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface CreateAlertStepperProps {
  children: ReactNode;
}

export const CreateAlertStepper = ({ children }: CreateAlertStepperProps) => {
  return <div className="space-y-3">{children}</div>;
};
