import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FIELD_HELP_CONTENT } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface AlertFieldHelpProps {
  fieldKey: keyof typeof FIELD_HELP_CONTENT;
  showHelp: boolean;
  className?: string;
}

export const AlertFieldHelp = ({ fieldKey, showHelp, className }: AlertFieldHelpProps) => {
  const content = FIELD_HELP_CONTENT[fieldKey];
  
  if (!showHelp || !content) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center w-4 h-4 rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className
          )}
          aria-label={`Help for ${content.title}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-64 p-3 text-sm"
      >
        <div className="space-y-1.5">
          <h4 className="font-medium text-foreground">{content.title}</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {content.description}
          </p>
          {content.example && (
            <p className="text-xs text-primary/80 italic">
              💡 {content.example}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
