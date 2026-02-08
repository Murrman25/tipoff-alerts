import { Target, GitCompareArrows, ChartNoAxesCombined, Timer, Zap, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTemplate, RuleType, PlanTier, RULE_TYPE_OPTIONS, DIRECTION_OPTIONS } from "@/types/alerts";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: AlertTemplate;
  onEdit: (template: AlertTemplate) => void;
  onDelete: (id: string) => void;
}

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

const tierColors: Record<PlanTier, { bg: string; text: string }> = {
  rookie: { bg: "bg-secondary", text: "text-muted-foreground" },
  pro: { bg: "bg-primary/20", text: "text-primary" },
  legend: { bg: "bg-blue-500/15", text: "text-blue-400" },
};

const tierLabels: Record<PlanTier, string> = {
  rookie: "Rookie",
  pro: "Pro",
  legend: "Legend",
};

export const TemplateCard = ({ template, onEdit, onDelete }: TemplateCardProps) => {
  const Icon = ruleTypeIcons[template.rule_type];
  const tier = getTierForRuleType(template.rule_type);
  const colors = tierColors[tier];
  const ruleTypeName = RULE_TYPE_OPTIONS.find((r) => r.id === template.rule_type)?.name || template.rule_type;
  const directionLabel = template.direction 
    ? DIRECTION_OPTIONS.find((d) => d.id === template.direction)?.name 
    : null;

  // Build parameter summary
  const params: string[] = [];
  if (template.threshold !== null) {
    const prefix = template.threshold >= 0 ? "+" : "";
    params.push(`${prefix}${template.threshold}`);
  }
  if (directionLabel) {
    params.push(directionLabel);
  }
  if (template.surge_window_minutes) {
    params.push(`${template.surge_window_minutes}m surge`);
  }
  if (template.run_window_minutes) {
    params.push(`${template.run_window_minutes}m run`);
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            {Icon && <Icon className="w-5 h-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name */}
            <h3 className="font-medium text-sm truncate">{template.name}</h3>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                {ruleTypeName}
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", colors.bg, colors.text)}
              >
                {tierLabels[tier]}
              </Badge>
            </div>

            {/* Parameters summary */}
            {params.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {params.join(" • ")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(template)}
              className="h-9 w-9"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(template.id)}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
