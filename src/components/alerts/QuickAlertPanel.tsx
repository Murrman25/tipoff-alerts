import { TrendingUp, TrendingDown, Trophy, Radio, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QUICK_ALERT_TEMPLATES, QuickAlertTemplateId, AlertCondition } from "@/types/alerts";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuickAlertPanelProps {
  selectedTemplate: QuickAlertTemplateId | null;
  onSelectTemplate: (templateId: QuickAlertTemplateId, defaults: Partial<AlertCondition>) => void;
}

const iconMap = {
  TrendingUp,
  TrendingDown,
  Trophy,
  Radio,
};

export const QuickAlertPanel = ({
  selectedTemplate,
  onSelectTemplate,
}: QuickAlertPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 group">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium group-hover:text-foreground transition-colors">
            Quick Alerts
          </span>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-2 data-[state=open]:slide-down-2">
        <div className="flex flex-wrap gap-2 pt-2 pb-4">
          {QUICK_ALERT_TEMPLATES.map((template) => {
            const Icon = iconMap[template.icon as keyof typeof iconMap];
            const isSelected = selectedTemplate === template.id;
            
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectTemplate(template.id, template.defaults)}
                className={cn(
                  "h-10 sm:h-9 px-4 sm:px-3 gap-2 sm:gap-1.5 transition-all duration-200",
                  "border-border hover:border-primary/50",
                  isSelected && "border-primary bg-primary/10 text-primary"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-sm font-medium">{template.name}</span>
              </Button>
            );
          })}
        </div>
        {selectedTemplate && (
          <p className="text-xs text-muted-foreground pb-3">
            {QUICK_ALERT_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
            {" • "}
            <span className="text-primary/80">Complete the fields below</span>
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
