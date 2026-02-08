import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertRuleTypeSelector } from "./AlertRuleTypeSelector";
import { AlertMarketSelector } from "./AlertMarketSelector";
import { AlertThresholdInput } from "./AlertThresholdInput";
import { AlertDirectionSelector } from "./AlertDirectionSelector";
import { AlertTimeWindow } from "./AlertTimeWindow";
import { AlertSurgeWindowSelector } from "./AlertSurgeWindowSelector";
import { AlertRunWindowSelector } from "./AlertRunWindowSelector";
import { AlertGamePeriodSelector } from "./AlertGamePeriodSelector";
import { 
  AlertTemplate, 
  AlertTemplateInput, 
  RuleType, 
  MarketType, 
  DirectionType, 
  TimeWindow, 
  GamePeriod,
  ALERT_TYPE_FIELD_CONFIG,
  PlanTier
} from "@/types/alerts";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: AlertTemplate | null;
  onSave: (input: AlertTemplateInput) => void;
  isSaving?: boolean;
}

const getDefaultMarketType = (ruleType: RuleType): MarketType => {
  const config = ALERT_TYPE_FIELD_CONFIG[ruleType];
  return config.forceMarketType || 'ml';
};

export const CreateTemplateModal = ({
  open,
  onOpenChange,
  editingTemplate,
  onSave,
  isSaving = false,
}: CreateTemplateModalProps) => {
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const userTier = (profile?.subscription_tier as PlanTier) || "rookie";

  // Form state
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("ml_threshold");
  const [marketType, setMarketType] = useState<MarketType>("ml");
  const [threshold, setThreshold] = useState<number | null>(null);
  const [direction, setDirection] = useState<DirectionType | null>("at_or_above");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("both");
  const [surgeWindowMinutes, setSurgeWindowMinutes] = useState<number | null>(15);
  const [runWindowMinutes, setRunWindowMinutes] = useState<number | null>(5);
  const [gamePeriod, setGamePeriod] = useState<GamePeriod>("full_game");

  // Reset form when opening or when editingTemplate changes
  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setName(editingTemplate.name);
        setRuleType(editingTemplate.rule_type);
        setMarketType(editingTemplate.market_type);
        setThreshold(editingTemplate.threshold);
        setDirection(editingTemplate.direction);
        setTimeWindow(editingTemplate.time_window);
        setSurgeWindowMinutes(editingTemplate.surge_window_minutes);
        setRunWindowMinutes(editingTemplate.run_window_minutes);
        setGamePeriod(editingTemplate.game_period || "full_game");
      } else {
        // Reset to defaults for new template
        setName("");
        setRuleType("ml_threshold");
        setMarketType("ml");
        setThreshold(null);
        setDirection("at_or_above");
        setTimeWindow("both");
        setSurgeWindowMinutes(15);
        setRunWindowMinutes(5);
        setGamePeriod("full_game");
      }
    }
  }, [open, editingTemplate]);

  // Update market type when rule type changes
  useEffect(() => {
    const config = ALERT_TYPE_FIELD_CONFIG[ruleType];
    if (config.forceMarketType) {
      setMarketType(config.forceMarketType);
    }
    if (config.forceTimeWindow) {
      setTimeWindow(config.forceTimeWindow);
    }
  }, [ruleType]);

  const fieldConfig = ALERT_TYPE_FIELD_CONFIG[ruleType];

  const handleSave = () => {
    if (!name.trim()) return;

    const input: AlertTemplateInput = {
      name: name.trim(),
      rule_type: ruleType,
      market_type: fieldConfig.forceMarketType || marketType,
      threshold: fieldConfig.showThreshold ? threshold : null,
      direction: fieldConfig.showDirection ? direction : null,
      time_window: fieldConfig.forceTimeWindow || timeWindow,
      surge_window_minutes: fieldConfig.showSurgeWindow ? surgeWindowMinutes : null,
      run_window_minutes: fieldConfig.showRunWindow ? runWindowMinutes : null,
      game_period: fieldConfig.showGamePeriod ? gamePeriod : null,
    };

    onSave(input);
  };

  const isValid = name.trim().length > 0 && name.trim().length <= 30;

  const content = (
    <div className="space-y-6 py-4">
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Template Name
        </Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          placeholder="e.g., Underdog ML Watch"
          className="bg-secondary/50"
        />
        <p className="text-xs text-muted-foreground">{name.length}/30 characters</p>
      </div>

      {/* Alert Type */}
      <AlertRuleTypeSelector
        value={ruleType}
        onChange={setRuleType}
        userTier={userTier}
      />

      {/* Market Type (for timed_surge) */}
      {fieldConfig.showMarketToggle && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Market
          </label>
          <AlertMarketSelector value={marketType} onChange={setMarketType} />
        </div>
      )}

      {/* Threshold */}
      {fieldConfig.showThreshold && (
        <AlertThresholdInput
          value={threshold}
          onChange={setThreshold}
          ruleType={ruleType}
          marketType={marketType}
        />
      )}

      {/* Direction */}
      {fieldConfig.showDirection && (
        <AlertDirectionSelector value={direction} onChange={setDirection} ruleType={ruleType} />
      )}

      {/* Time Window */}
      {fieldConfig.showTimeWindow && (
        <AlertTimeWindow value={timeWindow} onChange={setTimeWindow} />
      )}

      {/* Surge Window */}
      {fieldConfig.showSurgeWindow && (
        <AlertSurgeWindowSelector
          value={surgeWindowMinutes || 15}
          onChange={setSurgeWindowMinutes}
        />
      )}

      {/* Run Window */}
      {fieldConfig.showRunWindow && (
        <AlertRunWindowSelector
          value={runWindowMinutes || 5}
          onChange={setRunWindowMinutes}
        />
      )}

      {/* Game Period */}
      {fieldConfig.showGamePeriod && (
        <AlertGamePeriodSelector
          value={gamePeriod}
          onChange={setGamePeriod}
          sportID="BASKETBALL"
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="flex-1 bg-gold-gradient text-primary-foreground hover:opacity-90"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : editingTemplate ? (
            "Update Template"
          ) : (
            "Create Template"
          )}
        </Button>
      </div>
    </div>
  );

  const title = editingTemplate ? "Edit Template" : "Create Template";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
