import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageGlow } from "@/components/PageGlow";
import { ArrowLeft, Zap, HelpCircle, Target, GitCompareArrows, ChartNoAxesCombined, Timer, Mail, Bell, MessageSquare } from "lucide-react";
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
  AlertSurgeWindowSelector,
  AlertRunWindowSelector,
  AlertGamePeriodSelector,
} from "@/components/alerts";
import { AuthModal } from "@/components/auth";
import { TeamLogo } from "@/components/TeamLogo";
import {
  AlertCondition,
  QuickAlertTemplateId,
  ALERT_TYPE_FIELD_CONFIG,
} from "@/types/alerts";
import { GameEvent } from "@/types/games";
import { useAuth } from "@/hooks/useAuth";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { toast } from "sonner";
import { createAlert } from "@/lib/alertsApi";

const CreateAlert = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedEventID = searchParams.get("eventID");
  const { user, isLoading: authLoading } = useAuth();
  const { showHelp, toggleHelp } = useFirstTimeVisit("create_alert");

  const [condition, setCondition] = useState<AlertCondition>({
    ruleType: "ml_threshold",
    eventID: preSelectedEventID || null,
    marketType: "ml",
    teamSide: null,
    threshold: null,
    direction: null,
    timeWindow: "both",
    surgeWindowMinutes: undefined,
    runWindowMinutes: undefined,
    gamePeriod: undefined,
  });
  const [selectedGame, setSelectedGame] = useState<GameEvent | null>(null);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(["push"]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickAlertTemplateId | null>(null);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set(preSelectedEventID ? [2] : [1]));
  const userManuallyOpenedStep1Ref = useRef(false);

  const toggleStep = (step: number) => {
    // Track if user manually opens step 1 (to prevent auto-close from fighting user intent)
    if (step === 1) {
      userManuallyOpenedStep1Ref.current = true;
    }
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
        updated.direction = null;
        updated.surgeWindowMinutes = undefined;
        updated.runWindowMinutes = undefined;
        updated.gamePeriod = undefined;
      }
      
      // When rule type changes, apply field config defaults
      if (key === "ruleType") {
        const config = ALERT_TYPE_FIELD_CONFIG[value as AlertCondition['ruleType']];
        updated.direction = null;
        
        // Auto-set market type if forced by rule type
        if (config.forceMarketType) {
          updated.marketType = config.forceMarketType;
        }
        
        // Auto-set time window if forced by rule type
        if (config.forceTimeWindow) {
          updated.timeWindow = config.forceTimeWindow;
        }
        
        // Reset fields that are hidden for the new rule type
        if (!config.showThreshold) {
          updated.threshold = null;
        }
        if (!config.showDirection) {
          updated.direction = null;
        }
        if (!config.showSurgeWindow) {
          updated.surgeWindowMinutes = undefined;
        }
        if (!config.showRunWindow) {
          updated.runWindowMinutes = undefined;
        }
        if (!config.showGamePeriod) {
          updated.gamePeriod = undefined;
        } else {
          // Default to full_game when game period is shown
          updated.gamePeriod = 'full_game';
        }
        
        // Set default surge window for timed_surge
        if (value === 'timed_surge') {
          updated.surgeWindowMinutes = 15;
        }
        // Set default run window for momentum_run
        if (value === 'momentum_run') {
          updated.runWindowMinutes = 5;
        }
      }
      
      return updated;
    });
  };

  const handleGameSelect = (eventID: string | null, game: GameEvent | null, isAutoSelect = false) => {
    updateCondition("eventID", eventID);
    setSelectedGame(game);
    
    // Only auto-collapse step 1 if this is NOT a pre-select (user explicitly chose a game)
    // or if it's the initial auto-select and step 1 wasn't manually opened
    if (eventID && !isAutoSelect && !userManuallyOpenedStep1Ref.current) {
      setOpenSteps(new Set([2]));
    } else if (eventID && isAutoSelect && !userManuallyOpenedStep1Ref.current) {
      // For auto-select on page load, just ensure step 2 is open but don't close step 1 if user opened it
      setOpenSteps(prev => new Set([...prev, 2]));
    }
  };

  const handleTemplateSelect = (templateId: QuickAlertTemplateId, defaults: Partial<AlertCondition>) => {
    setSelectedTemplate(templateId);
    setCondition((prev) => ({
      ...prev,
      ...defaults,
    }));
  };

  // Get field configuration for current rule type
  const fieldConfig = ALERT_TYPE_FIELD_CONFIG[condition.ruleType];

  // Step completion checks
  const isStep1Complete = condition.eventID !== null;
  const isStep2Complete = isStep1Complete && 
    (!fieldConfig.showTeamSelector || condition.teamSide !== null) && 
    (!fieldConfig.showThreshold || condition.threshold !== null) &&
    (!fieldConfig.showDirection || condition.direction !== null);
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
      case "ml_threshold": return <Target {...iconProps} />;
      case "spread_threshold": return <GitCompareArrows {...iconProps} />;
      case "ou_threshold": return <ChartNoAxesCombined {...iconProps} />;
      case "score_margin": return <Target {...iconProps} />;
      case "timed_surge": return <Timer {...iconProps} />;
      case "momentum_run": return <Zap {...iconProps} />;
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
    (!fieldConfig.showTeamSelector || condition.teamSide !== null) &&
    notificationChannels.length > 0 &&
    (!fieldConfig.showThreshold || condition.threshold !== null) &&
    (!fieldConfig.showDirection || condition.direction !== null);

  const saveAlertToDatabase = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await createAlert({
        ruleType: condition.ruleType,
        eventID: condition.eventID,
        marketType: condition.marketType,
        teamSide: condition.teamSide,
        threshold: condition.threshold,
        direction: condition.direction,
        timeWindow: condition.timeWindow,
        channels: notificationChannels,
        eventName: selectedGame
          ? `${selectedGame.teams.away.name || selectedGame.teams.away.abbreviation} @ ${selectedGame.teams.home.name || selectedGame.teams.home.abbreviation}`
          : undefined,
      });

      toast.success("Alert created successfully!");
      navigate("/alerts");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create alert";
      toast.error(message);
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
    <div className="min-h-screen bg-background relative">
      <PageGlow />
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
                      userTier="legend"
                    />
                  </div>
                  <AlertFieldHelp fieldKey="ruleType" showHelp={showHelp} className="mt-7" />
                </div>

                {/* Market Toggle - only show when configured */}
                {fieldConfig.showMarketToggle && (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <AlertMarketSelector
                        value={condition.marketType}
                        onChange={(v) => updateCondition("marketType", v)}
                      />
                    </div>
                    <AlertFieldHelp fieldKey="marketType" showHelp={showHelp} className="mt-7" />
                  </div>
                )}

                {/* Team Selector - only show when configured */}
                {fieldConfig.showTeamSelector && (
                  <AlertTeamSelector
                    game={selectedGame}
                    value={condition.teamSide}
                    onChange={(v) => updateCondition("teamSide", v)}
                  />
                )}

                {/* Threshold and Direction Row */}
                {(fieldConfig.showThreshold || fieldConfig.showDirection) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fieldConfig.showThreshold && (
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <AlertThresholdInput
                            value={condition.threshold}
                            onChange={(v) => updateCondition("threshold", v)}
                            marketType={condition.marketType}
                            label={fieldConfig.thresholdLabel}
                            placeholder={fieldConfig.thresholdPlaceholder}
                          />
                        </div>
                        <AlertFieldHelp fieldKey="threshold" showHelp={showHelp} className="mt-7" />
                      </div>
                    )}
                    {fieldConfig.showDirection && (
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
                    )}
                  </div>
                )}

                {/* Surge Window - for Line Surge alerts */}
                {fieldConfig.showSurgeWindow && (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <AlertSurgeWindowSelector
                        value={condition.surgeWindowMinutes}
                        onChange={(v) => updateCondition("surgeWindowMinutes", v)}
                      />
                    </div>
                    <AlertFieldHelp fieldKey="surgeWindow" showHelp={showHelp} className="mt-7" />
                  </div>
                )}

                {/* Run Window - for Momentum alerts */}
                {fieldConfig.showRunWindow && (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <AlertRunWindowSelector
                        value={condition.runWindowMinutes}
                        onChange={(v) => updateCondition("runWindowMinutes", v)}
                      />
                    </div>
                    <AlertFieldHelp fieldKey="runWindow" showHelp={showHelp} className="mt-7" />
                  </div>
                )}

                {/* Game Period - for Score Margin, Line Surge, Momentum */}
                {fieldConfig.showGamePeriod && (
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <AlertGamePeriodSelector
                        value={condition.gamePeriod}
                        onChange={(v) => updateCondition("gamePeriod", v)}
                        sportID={selectedGame?.sportID}
                      />
                    </div>
                    <AlertFieldHelp fieldKey="gamePeriod" showHelp={showHelp} className="mt-7" />
                  </div>
                )}
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
            className="w-full bg-gold-gradient text-primary-foreground hover:opacity-90 h-12 text-base font-medium"
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
