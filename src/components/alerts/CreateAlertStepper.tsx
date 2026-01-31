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
            "flex items-center justify-between w-full py-2 px-3 rounded-md",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen
              ? "bg-secondary/80"
              : isComplete
              ? "bg-primary/5 hover:bg-primary/10"
              : "bg-secondary/30 hover:bg-secondary/50"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium",
                "transition-all duration-200",
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isOpen
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? "✓" : stepNumber}
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                isComplete ? "text-primary" : isOpen ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {title}
            </span>
            {summary && !isOpen && (
              <span className="text-xs text-muted-foreground ml-1">
                · {summary}
              </span>
            )}
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
        <div className="pt-3 pb-2 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface CreateAlertStepperProps {
  children: ReactNode;
}

export const CreateAlertStepper = ({ children }: CreateAlertStepperProps) => {
  return <div className="space-y-2">{children}</div>;
};
