import { TrendingUp, TrendingDown, Trophy, Radio, ChevronDown, Target, GitCompareArrows, ChartNoAxesCombined, Timer, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QUICK_ALERT_TEMPLATES, QuickAlertTemplateId, AlertCondition, AlertTemplate, RuleType, PlanTier, RULE_TYPE_OPTIONS } from "@/types/alerts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAlertTemplates } from "@/hooks/useAlertTemplates";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickAlertPanelProps {
  selectedTemplate: QuickAlertTemplateId | string | null;
  onSelectTemplate: (templateId: QuickAlertTemplateId | string, defaults: Partial<AlertCondition>) => void;
}

// Legacy icon map for hardcoded templates
const legacyIconMap = {
  TrendingUp,
  TrendingDown,
  Trophy,
  Radio,
};

// Icon map for rule types
const ruleTypeIcons: Record<RuleType, React.ElementType> = {
  ml_threshold: Target,
  spread_threshold: GitCompareArrows,
  ou_threshold: ChartNoAxesCombined,
  score_margin: Target,
  timed_surge: Timer,
  momentum_run: Zap,
};

const getTierForRuleType = (ruleType: RuleType): PlanTier => {
  return RULE_TYPE_OPTIONS.find((r) => r.id === ruleType)?.planRequired || "rookie";
};

const tierColors: Record<PlanTier, { bg: string; text: string; selectedBg: string; selectedText: string }> = {
  rookie: { 
    bg: "bg-secondary", 
    text: "text-muted-foreground",
    selectedBg: "bg-muted-foreground",
    selectedText: "text-background"
  },
  pro: { 
    bg: "bg-amber-500/20", 
    text: "text-amber-400",
    selectedBg: "bg-amber-500",
    selectedText: "text-white"
  },
  legend: { 
    bg: "bg-purple-500/20", 
    text: "text-purple-400",
    selectedBg: "bg-purple-500",
    selectedText: "text-white"
  },
};

export const QuickAlertPanel = ({
  selectedTemplate,
  onSelectTemplate,
}: QuickAlertPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const { data: userTemplates, isLoading } = useAlertTemplates();

  const hasUserTemplates = userTemplates && userTemplates.length > 0;

  // Convert user template to alert condition defaults
  const templateToDefaults = (template: AlertTemplate): Partial<AlertCondition> => ({
    ruleType: template.rule_type,
    marketType: template.market_type,
    threshold: template.threshold,
    direction: template.direction,
    timeWindow: template.time_window,
    surgeWindowMinutes: template.surge_window_minutes || undefined,
    runWindowMinutes: template.run_window_minutes || undefined,
    gamePeriod: template.game_period || undefined,
  });

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
        {/* Loading state */}
        {user && isLoading && (
          <div className="flex gap-2 pt-2 pb-4">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}

        {/* User templates (when logged in and has templates) */}
        {user && !isLoading && hasUserTemplates && (
          <div className="flex flex-wrap gap-2 pt-2 pb-4">
            {userTemplates.map((template) => {
              const Icon = ruleTypeIcons[template.rule_type];
              const isSelected = selectedTemplate === template.id;
              const tier = getTierForRuleType(template.rule_type);
              const colors = tierColors[tier];
              
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate(template.id, templateToDefaults(template))}
                  className={cn(
                    "h-10 sm:h-9 px-3 gap-2 transition-all duration-200",
                    "border-border hover:border-primary/50",
                    isSelected && "border-primary bg-primary/10 text-primary"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span className="text-sm font-medium truncate max-w-[100px]">{template.name}</span>
                  <span className={cn(
                    "text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded shrink-0",
                    isSelected ? colors.selectedBg : colors.bg,
                    isSelected ? colors.selectedText : colors.text
                  )}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                </Button>
              );
            })}
          </div>
        )}

        {/* Empty state for logged-in users with no templates */}
        {user && !isLoading && !hasUserTemplates && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Create templates for one-tap alert setup
            </p>
            <Link to="/alerts">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </Link>
          </div>
        )}

        {/* Fallback to hardcoded templates for non-authenticated users */}
        {!user && (
          <div className="flex flex-wrap gap-2 pt-2 pb-4">
            {QUICK_ALERT_TEMPLATES.map((template) => {
              const Icon = legacyIconMap[template.icon as keyof typeof legacyIconMap];
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
        )}

        {/* Description for selected template */}
        {selectedTemplate && !user && (
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
