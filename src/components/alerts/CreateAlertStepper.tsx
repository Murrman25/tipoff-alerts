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
            "flex items-center justify-between w-full p-3 rounded-lg transition-all",
            "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen
              ? "border-primary/30 bg-secondary"
              : isComplete
              ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
              : "border-border bg-secondary/50 hover:bg-secondary"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
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
                  "text-sm font-medium",
                  isComplete ? "text-primary" : "text-foreground"
                )}
              >
                {title}
              </span>
              {summary && !isOpen && (
                <span className="text-xs text-muted-foreground">{summary}</span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
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
