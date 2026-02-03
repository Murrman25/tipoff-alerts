import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap, HelpCircle, Target, TrendingUp, BarChart3, Percent, Scale, Award, Mail, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertNotificationChannels,
  NotificationChannel,
  AlertFieldHelp,
  QuickAlertPanel,
  CreateAlertStepper,
  AlertStep,
  AlertSummary,
} from "@/components/alerts";
import { AuthModal } from "@/components/auth";
import { TeamLogo } from "@/components/TeamLogo";
import {
  AlertCondition,
  QuickAlertTemplateId,
} from "@/types/alerts";
import { GameEvent } from "@/types/games";
import { useAuth } from "@/hooks/useAuth";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    direction: null,
    timeWindow: "both",
  });
  const [selectedGame, setSelectedGame] = useState<GameEvent | null>(null);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(["email"]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickAlertTemplateId | null>(null);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set(preSelectedEventID ? [2] : [1]));

  const toggleStep = (step: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  const openStep = (step: number) => {
    setOpenSteps((prev) => new Set(prev).add(step));
  };

  const updateCondition = <K extends keyof AlertCondition>(
    key: K,
    value: AlertCondition[K]
  ) => {
    setCondition((prev) => {
      const updated = { ...prev, [key]: value };
      
      // When game changes, reset all condition fields (but not ruleType or notifications)
      if (key === "eventID") {
        updated.teamSide = null;
        updated.threshold = null;
        updated.marketType = "sp";
        updated.direction = null;
      }
      
      // When rule type changes, reset direction so user must explicitly select
      if (key === "ruleType") {
        updated.direction = null;
      }
      
      return updated;
    });
  };

  const handleGameSelect = (eventID: string | null, game: GameEvent | null) => {
    updateCondition("eventID", eventID);
    setSelectedGame(game);
    if (eventID) {
      // Auto-collapse step 1, open step 2
      setOpenSteps(new Set([2]));
    }
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

  // Direction is required when threshold is needed - selecting direction triggers auto-collapse
  const needsDirection = needsThreshold;

  // Step completion checks
  const isStep1Complete = condition.eventID !== null;
  const isStep2Complete = isStep1Complete && 
    condition.teamSide !== null && 
    (!needsThreshold || condition.threshold !== null) &&
    (!needsDirection || condition.direction !== null);
  const isStep3Complete = notificationChannels.length > 0;

  // Track previous step 2 completion state for auto-collapse
  const prevStep2Complete = useRef(isStep2Complete);
  
  // Auto-collapse step 2 when completed and open step 3
  useEffect(() => {
    if (isStep2Complete && !prevStep2Complete.current && openSteps.has(2)) {
      setOpenSteps(new Set([3]));
    }
    prevStep2Complete.current = isStep2Complete;
  }, [isStep2Complete, openSteps]);

  // Rich summary components
  const getStep1SummaryContent = () => {
    if (!selectedGame) return null;
    const awayAbbr = selectedGame.teams.away.abbreviation || selectedGame.teams.away.name?.slice(0, 3).toUpperCase() || 'AWY';
    const homeAbbr = selectedGame.teams.home.abbreviation || selectedGame.teams.home.name?.slice(0, 3).toUpperCase() || 'HME';
    return (
      <div className="flex items-center gap-2">
        <TeamLogo 
          logoUrl={selectedGame.teams.away.logoUrl} 
          teamName={selectedGame.teams.away.name || awayAbbr} 
          size={18} 
        />
        <span className="text-xs text-muted-foreground">@</span>
        <TeamLogo 
          logoUrl={selectedGame.teams.home.logoUrl} 
          teamName={selectedGame.teams.home.name || homeAbbr} 
          size={18} 
        />
        <span className="text-xs text-foreground font-medium">{awayAbbr} @ {homeAbbr}</span>
      </div>
    );
  };

  const getRuleTypeIcon = (ruleType: string) => {
    const iconProps = { size: 14, className: "text-primary" };
    switch (ruleType) {
      case "threshold_at": return <Target {...iconProps} />;
      case "threshold_cross": return <TrendingUp {...iconProps} />;
      case "value_change": return <BarChart3 {...iconProps} />;
      case "percentage_move": return <Percent {...iconProps} />;
      case "arbitrage": return <Scale {...iconProps} />;
      case "best_available": return <Award {...iconProps} />;
      default: return <Target {...iconProps} />;
    }
  };

  const getStep2SummaryContent = () => {
    if (!isStep2Complete || !selectedGame) return null;
    const selectedTeam = condition.teamSide === "home" ? selectedGame.teams.home : selectedGame.teams.away;
    const teamAbbr = selectedTeam?.abbreviation || selectedTeam?.name?.slice(0, 3).toUpperCase() || '';
    return (
      <div className="flex items-center gap-2">
        {getRuleTypeIcon(condition.ruleType)}
        <span className="text-xs font-medium">{condition.marketType.toUpperCase()}</span>
        {selectedTeam && (
          <TeamLogo 
            logoUrl={selectedTeam.logoUrl} 
            teamName={selectedTeam.name || teamAbbr} 
            size={16} 
          />
        )}
        {condition.threshold !== null && (
          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
            {condition.threshold > 0 ? `+${condition.threshold}` : condition.threshold}
          </span>
        )}
      </div>
    );
  };

  const getStep3SummaryContent = () => {
    if (notificationChannels.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5">
        {notificationChannels.includes('email') && <Mail size={14} className="text-primary" />}
        {notificationChannels.includes('push') && <Bell size={14} className="text-primary" />}
        {notificationChannels.includes('sms') && <MessageSquare size={14} className="text-primary" />}
      </div>
    );
  };

  // Generate step summaries (text fallback)
  const getStep1Summary = () => {
    if (!condition.eventID || !selectedGame) return undefined;
    const awayAbbr = selectedGame.teams.away.abbreviation || selectedGame.teams.away.name?.slice(0, 3).toUpperCase() || 'AWY';
    const homeAbbr = selectedGame.teams.home.abbreviation || selectedGame.teams.home.name?.slice(0, 3).toUpperCase() || 'HME';
    return `${awayAbbr} @ ${homeAbbr}`;
  };

  const isFormValid =
    condition.eventID !== null &&
    condition.teamSide !== null &&
    notificationChannels.length > 0 &&
    (condition.threshold !== null ||
      condition.ruleType === "value_change" ||
      condition.ruleType === "arbitrage" ||
      condition.ruleType === "best_available") &&
    (condition.direction !== null ||
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

      // Send confirmation email if email channel is selected
      if (notificationChannels.includes("email") && user.email) {
        const eventName = selectedGame 
          ? `${selectedGame.teams.away.name || selectedGame.teams.away.abbreviation} @ ${selectedGame.teams.home.name || selectedGame.teams.home.abbreviation}`
          : "Unknown Event";

        try {
          await supabase.functions.invoke("send-alert-confirmation", {
            body: {
              email: user.email,
              alertDetails: {
                eventName,
                teamSide: condition.teamSide,
                marketType: condition.marketType,
                threshold: condition.threshold,
                direction: condition.direction,
                ruleType: condition.ruleType,
              },
            },
          });
          console.log("Confirmation email sent successfully");
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the alert creation if email fails
        }
      }

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

  // Steps for progress bar
  const stepProgress = [
    { isComplete: isStep1Complete },
    { isComplete: isStep2Complete },
    { isComplete: isStep3Complete },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container px-4 md:px-6">
          <div className="flex items-center h-16 gap-4">
            <Link
              to="/games"
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
        <div className="space-y-6">
          {/* Quick Alert Panel */}
          <QuickAlertPanel
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleTemplateSelect}
          />

          {/* Stepper Form */}
          <CreateAlertStepper steps={stepProgress}>
            {/* Step 1: Select Game */}
            <AlertStep
              stepNumber={1}
              title="Select Game"
              isOpen={openSteps.has(1)}
              isComplete={isStep1Complete}
              summary={getStep1Summary()}
              summaryContent={getStep1SummaryContent()}
              onToggle={() => toggleStep(1)}
            >
              <AlertEventSelector
                value={condition.eventID}
                onChange={handleGameSelect}
                preSelectedEventID={preSelectedEventID}
              />
            </AlertStep>

            {/* Step 2: Set Condition */}
            <AlertStep
              stepNumber={2}
              title="Set Condition"
              isOpen={openSteps.has(2)}
              isComplete={isStep2Complete}
              summaryContent={getStep2SummaryContent()}
              onToggle={() => toggleStep(2)}
            >
              <div className="space-y-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    game={selectedGame}
                    value={condition.teamSide}
                    onChange={(v) => updateCondition("teamSide", v)}
                  />
                </div>

                {/* Threshold and Direction */}
                {needsThreshold && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStep(3)}
                  className="w-full"
                >
                  Continue to Notifications
                </Button>
              </div>
            </AlertStep>

            {/* Step 3: Notify Me */}
            <AlertStep
              stepNumber={3}
              title="Notify Me"
              isOpen={openSteps.has(3)}
              isComplete={isStep3Complete}
              summaryContent={getStep3SummaryContent()}
              onToggle={() => toggleStep(3)}
            >
              <AlertNotificationChannels
                selectedChannels={notificationChannels}
                onChange={setNotificationChannels}
              />
            </AlertStep>
          </CreateAlertStepper>

          {/* Alert Summary - only when all steps complete */}
          <AlertSummary
            condition={condition}
            selectedGame={selectedGame}
            notificationChannels={notificationChannels}
            isVisible={isFormValid}
          />

          {/* Create Button */}
          <Button
            onClick={handleCreateAlert}
            disabled={!isFormValid || isSaving}
            className="w-full bg-amber-gradient text-primary-foreground hover:opacity-90 h-12 text-base font-medium"
          >
            <Zap className="w-5 h-5 mr-2" />
            {isSaving ? "Creating..." : user ? "Create Alert" : "Sign in to Create Alert"}
          </Button>
        </div>
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
