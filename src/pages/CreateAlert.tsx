import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/alerts";
import {
  AlertCondition,
  RuleType,
  MarketType,
  DirectionType,
  TimeWindow,
} from "@/types/alerts";
import { toast } from "sonner";

const CreateAlert = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedEventID = searchParams.get("eventID");

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

  const updateCondition = <K extends keyof AlertCondition>(
    key: K,
    value: AlertCondition[K]
  ) => {
    setCondition((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Reset dependent fields when event changes
      if (key === "eventID") {
        updated.teamSide = null;
      }
      
      // Reset direction when rule type changes
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

  const isFormValid =
    condition.eventID !== null &&
    condition.teamSide !== null &&
    notificationChannels.length > 0 &&
    (condition.threshold !== null ||
      condition.ruleType === "value_change" ||
      condition.ruleType === "arbitrage" ||
      condition.ruleType === "best_available");

  const handleCreateAlert = () => {
    if (!isFormValid) {
      toast.error("Please complete all required fields");
      return;
    }
    
    if (notificationChannels.length === 0) {
      toast.error("Please select at least one notification channel");
      return;
    }
    
    // TODO: Save to Supabase with auth
    toast.success("Alert created successfully!");
    console.log("Alert condition:", condition);
    console.log("Notification channels:", notificationChannels);
    navigate("/alerts");
  };

  // Check if threshold is needed
  const needsThreshold =
    condition.ruleType === "threshold_at" ||
    condition.ruleType === "threshold_cross" ||
    condition.ruleType === "percentage_move";

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
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8 max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            {/* Rule Type Selector */}
            <AlertRuleTypeSelector
              value={condition.ruleType}
              onChange={(v) => updateCondition("ruleType", v)}
              userTier="pro" // TODO: Get from auth
            />

            {/* Event, Market, Team Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AlertEventSelector
                value={condition.eventID}
                onChange={(v) => updateCondition("eventID", v)}
              />
              <AlertMarketSelector
                value={condition.marketType}
                onChange={(v) => updateCondition("marketType", v)}
              />
              <AlertTeamSelector
                eventID={condition.eventID}
                value={condition.teamSide}
                onChange={(v) => updateCondition("teamSide", v)}
              />
            </div>

            {/* Threshold and Direction Row */}
            {needsThreshold && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AlertThresholdInput
                  value={condition.threshold}
                  onChange={(v) => updateCondition("threshold", v)}
                  marketType={condition.marketType}
                />
                <AlertDirectionSelector
                  value={condition.direction}
                  onChange={(v) => updateCondition("direction", v)}
                  ruleType={condition.ruleType}
                />
              </div>
            )}

            {/* Time Window */}
            <AlertTimeWindow
              value={condition.timeWindow}
              onChange={(v) => updateCondition("timeWindow", v)}
            />

            {/* Notification Channels */}
            <AlertNotificationChannels
              selectedChannels={notificationChannels}
              onChange={setNotificationChannels}
            />

            {/* Alert Summary */}
            <AlertSummary condition={condition} />

            {/* Create Button */}
            <Button
              onClick={handleCreateAlert}
              disabled={!isFormValid}
              className="w-full bg-amber-gradient text-primary-foreground hover:opacity-90 h-12 text-base font-medium"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Alert
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateAlert;
