import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertRuleTypeSelector,
  AlertEventSelector,
  AlertMarketSelector,
  AlertTeamSelector,
  AlertThresholdInput,
  AlertDirectionSelector,
  AlertTimeWindow,
  AlertSummary,
  AlertNotificationChannels,
  NotificationChannel,
  AlertFieldHelp,
  QuickAlertPanel,
  CreateAlertStepper,
  AlertStep,
} from "@/components/alerts";
import { AuthModal } from "@/components/auth";
import {
  AlertCondition,
  RuleType,
  MarketType,
  DirectionType,
  TimeWindow,
  QuickAlertTemplateId,
} from "@/types/alerts";
import { useAuth } from "@/hooks/useAuth";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mockGames } from "@/data/mockGames";

const CreateAlert = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedEventID = searchParams.get("eventID");
  const { user, isLoading: authLoading } = useAuth();
  const { showHelp, toggleHelp } = useFirstTimeVisit("create_alert");

  const [condition, setCondition] = useState<AlertCondition>({
    ruleType: "threshold_at",
    eventID: preSelectedEventID || null,
    marketType: "sp",
    teamSide: null,
    threshold: null,
    direction: "at_or_above",
    timeWindow: "both",
  });
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(["email"]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickAlertTemplateId | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(preSelectedEventID ? 2 : 1);

  const updateCondition = <K extends keyof AlertCondition>(
    key: K,
    value: AlertCondition[K]
  ) => {
    setCondition((prev) => {
      const updated = { ...prev, [key]: value };
      
      if (key === "eventID") {
        updated.teamSide = null;
      }
      
      if (key === "ruleType") {
        if (value === "threshold_cross") {
          updated.direction = "crosses_above";
        } else if (value === "threshold_at") {
          updated.direction = "at_or_above";
        }
      }
      
      return updated;
    });
  };

  const handleTemplateSelect = (templateId: QuickAlertTemplateId, defaults: Partial<AlertCondition>) => {
    setSelectedTemplate(templateId);
    setCondition((prev) => ({
      ...prev,
      ...defaults,
    }));
  };

  // Check if threshold is needed
  const needsThreshold =
    condition.ruleType === "threshold_at" ||
    condition.ruleType === "threshold_cross" ||
    condition.ruleType === "percentage_move";

  // Step completion checks
  const isStep1Complete = condition.eventID !== null;
  const isStep2Complete = isStep1Complete && condition.teamSide !== null && (
    !needsThreshold || condition.threshold !== null
  );

  // Generate step summaries
  const getStep1Summary = () => {
    if (!condition.eventID) return undefined;
    const game = mockGames.find(g => g.eventID === condition.eventID);
    if (!game) return condition.eventID;
    return `${game.teams.away.abbreviation} @ ${game.teams.home.abbreviation}`;
  };

  const getStep2Summary = () => {
    if (!isStep2Complete) return undefined;
    const parts = [];
    if (condition.marketType) parts.push(condition.marketType.toUpperCase());
    if (condition.threshold !== null) parts.push(condition.threshold > 0 ? `+${condition.threshold}` : condition.threshold);
    return parts.join(" • ");
  };

  const isFormValid =
    condition.eventID !== null &&
    condition.teamSide !== null &&
    notificationChannels.length > 0 &&
    (condition.threshold !== null ||
      condition.ruleType === "value_change" ||
      condition.ruleType === "arbitrage" ||
      condition.ruleType === "best_available");

  const saveAlertToDatabase = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: alertData, error: alertError } = await supabase
        .from("alerts")
        .insert({
          user_id: user.id,
          rule_type: condition.ruleType,
          event_id: condition.eventID,
          market_type: condition.marketType,
          team_side: condition.teamSide,
          threshold: condition.threshold,
          direction: condition.direction,
          time_window: condition.timeWindow,
        })
        .select()
        .single();

      if (alertError) throw alertError;

      const channelInserts = notificationChannels.map((channel) => ({
        alert_id: alertData.id,
        channel_type: channel,
        is_enabled: true,
      }));

      const { error: channelError } = await supabase
        .from("alert_notification_channels")
        .insert(channelInserts);

      if (channelError) throw channelError;

      toast.success("Alert created successfully!");
      navigate("/alerts");
    } catch (error: any) {
      toast.error(error.message || "Failed to create alert");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!isFormValid) {
      toast.error("Please complete all required fields");
      return;
    }
    
    if (notificationChannels.length === 0) {
      toast.error("Please select at least one notification channel");
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    await saveAlertToDatabase();
  };

  const handleAuthSuccess = async () => {
    setTimeout(async () => {
      await saveAlertToDatabase();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container px-4 md:px-6">
          <div className="flex items-center h-16 gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex-1 flex justify-center">
              <h1 className="text-lg font-semibold">Create Alert</h1>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showHelp}
                    onPressedChange={toggleHelp}
                    aria-label="Toggle help mode"
                    className="h-9 w-9 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {showHelp ? "Hide help tips" : "Show help tips"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-5">
            {/* Quick Alert Panel */}
            <QuickAlertPanel
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
            />

            {/* Stepper Form */}
            <CreateAlertStepper>
              {/* Step 1: Select Game */}
              <AlertStep
                stepNumber={1}
                title="Select Game"
                isOpen={currentStep === 1}
                isComplete={isStep1Complete}
                summary={getStep1Summary()}
                onToggle={() => setCurrentStep(1)}
              >
                <div className="flex items-center gap-2">
                  <AlertEventSelector
                    value={condition.eventID}
                    onChange={(v) => {
                      updateCondition("eventID", v);
                      if (v) setCurrentStep(2);
                    }}
                  />
                  <AlertFieldHelp fieldKey="teamSide" showHelp={showHelp} />
                </div>
              </AlertStep>

              {/* Step 2: Set Condition */}
              <AlertStep
                stepNumber={2}
                title="Set Condition"
                isOpen={currentStep === 2}
                isComplete={isStep2Complete}
                summary={getStep2Summary()}
                onToggle={() => isStep1Complete && setCurrentStep(2)}
              >
                <div className="space-y-4">
                  {/* Rule Type */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <AlertRuleTypeSelector
                        value={condition.ruleType}
                        onChange={(v) => updateCondition("ruleType", v)}
                        userTier="pro"
                      />
                    </div>
                    <AlertFieldHelp fieldKey="ruleType" showHelp={showHelp} className="mt-7" />
                  </div>

                  {/* Market + Team Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <AlertMarketSelector
                          value={condition.marketType}
                          onChange={(v) => updateCondition("marketType", v)}
                        />
                      </div>
                      <AlertFieldHelp fieldKey="marketType" showHelp={showHelp} className="mt-7" />
                    </div>
                    <AlertTeamSelector
                      eventID={condition.eventID}
                      value={condition.teamSide}
                      onChange={(v) => updateCondition("teamSide", v)}
                    />
                  </div>

                  {/* Threshold and Direction */}
                  {needsThreshold && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <AlertThresholdInput
                            value={condition.threshold}
                            onChange={(v) => updateCondition("threshold", v)}
                            marketType={condition.marketType}
                          />
                        </div>
                        <AlertFieldHelp fieldKey="threshold" showHelp={showHelp} className="mt-7" />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <AlertDirectionSelector
                            value={condition.direction}
                            onChange={(v) => updateCondition("direction", v)}
                            ruleType={condition.ruleType}
                          />
                        </div>
                        <AlertFieldHelp fieldKey="direction" showHelp={showHelp} className="mt-7" />
                      </div>
                    </div>
                  )}

                  {/* Time Window */}
                  {condition.ruleType !== "arbitrage" && (
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <AlertTimeWindow
                          value={condition.timeWindow}
                          onChange={(v) => updateCondition("timeWindow", v)}
                        />
                      </div>
                      <AlertFieldHelp fieldKey="timeWindow" showHelp={showHelp} className="mt-7" />
                    </div>
                  )}

                  {isStep2Complete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                      className="w-full"
                    >
                      Continue to Notifications
                    </Button>
                  )}
                </div>
              </AlertStep>

              {/* Step 3: Notify Me */}
              <AlertStep
                stepNumber={3}
                title="Notify Me"
                isOpen={currentStep === 3}
                isComplete={notificationChannels.length > 0}
                summary={notificationChannels.length > 0 ? notificationChannels.join(", ") : undefined}
                onToggle={() => isStep2Complete && setCurrentStep(3)}
              >
                <AlertNotificationChannels
                  selectedChannels={notificationChannels}
                  onChange={setNotificationChannels}
                />
              </AlertStep>
            </CreateAlertStepper>

            {/* Alert Summary */}
            <AlertSummary condition={condition} />

            {/* Create Button */}
            <Button
              onClick={handleCreateAlert}
              disabled={!isFormValid || isSaving}
              className="w-full bg-amber-gradient text-primary-foreground hover:opacity-90 h-12 text-base font-medium"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isSaving ? "Creating..." : user ? "Create Alert" : "Sign in to Create Alert"}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default CreateAlert;
