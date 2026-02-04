import { useState } from "react";
import { Target, ArrowUpDown, TrendingUp, Timer, Zap, Check, Lock, Crown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/types/profile";

interface AlertTypeInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ElementType;
  examples: string[];
  minTier: SubscriptionTier;
}

const ALERT_TYPES: AlertTypeInfo[] = [
  {
    id: "ml_threshold",
    name: "Moneyline Alerts",
    shortName: "Moneyline",
    description: "Get notified when moneyline odds reach or cross your target value. Perfect for finding value when favorites become underdogs or lines move in your favor.",
    icon: Target,
    examples: [
      "Alert when Bulls ML reaches +150 or better",
      "Notify me if Lakers ML crosses below -200",
      "Track when any underdog hits +300",
    ],
    minTier: "rookie",
  },
  {
    id: "spread_threshold",
    name: "Spread Alerts",
    shortName: "Spread",
    description: "Monitor point spread movements and get alerted when lines hit your desired number. Essential for bettors who need a specific number.",
    icon: ArrowUpDown,
    examples: [
      "Alert when Chiefs spread reaches +3.5",
      "Notify when Celtics spread crosses -7",
      "Track spread movement on all primetime games",
    ],
    minTier: "rookie",
  },
  {
    id: "ou_threshold",
    name: "Over/Under Alerts",
    shortName: "O/U",
    description: "Track total points lines and get notified when they move above or below your target. Great for totals bettors watching weather or injury news.",
    icon: TrendingUp,
    examples: [
      "Alert when O/U drops below 42.5",
      "Notify when total reaches 220 or higher",
      "Track all NBA games with totals over 230",
    ],
    minTier: "rookie",
  },
  {
    id: "score_margin",
    name: "Score Margin Alert",
    shortName: "Score Margin",
    description: "Live in-game alerts when the score margin reaches specific thresholds. Perfect for live betting opportunities when games get close or blow out.",
    icon: Target,
    examples: [
      "Alert when margin reaches 10+ points",
      "Notify when game becomes within 3 points",
      "Track any blowout exceeding 20 point lead",
    ],
    minTier: "pro",
  },
  {
    id: "timed_surge",
    name: "Timed Line Surge Alert",
    shortName: "Line Surge",
    description: "Get notified when lines move rapidly within a short time window. Catch sharp money movements and steam moves before the market adjusts.",
    icon: Timer,
    examples: [
      "Alert on 3+ point swing in 30 minutes",
      "Track rapid ML movements (50+ cents)",
      "Notify on any sudden line reversal",
    ],
    minTier: "legend",
  },
  {
    id: "momentum_run",
    name: "Momentum Run Alert",
    shortName: "Momentum",
    description: "Live alerts triggered by scoring runs and momentum shifts. Know instantly when a team goes on a run that could swing the game.",
    icon: Zap,
    examples: [
      "Alert on 10-0 scoring runs",
      "Notify when team scores 8 unanswered",
      "Track momentum shifts in close games",
    ],
    minTier: "legend",
  },
];

const TIER_DISPLAY: Record<SubscriptionTier, { label: string; color: string; bgColor: string }> = {
  rookie: { label: "Rookie", color: "text-muted-foreground", bgColor: "bg-secondary" },
  pro: { label: "Pro", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  legend: { label: "Legend", color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

const TIER_LIMITS: Record<SubscriptionTier, { alerts: string; types: string[] }> = {
  rookie: {
    alerts: "1 active alert",
    types: ["ml_threshold", "spread_threshold", "ou_threshold"],
  },
  pro: {
    alerts: "Up to 15 active alerts",
    types: ["ml_threshold", "spread_threshold", "ou_threshold", "score_margin"],
  },
  legend: {
    alerts: "Unlimited alerts",
    types: ["ml_threshold", "spread_threshold", "ou_threshold", "score_margin", "timed_surge", "momentum_run"],
  },
};

export const AlertTypes = () => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("rookie");
  const [selectedAlertType, setSelectedAlertType] = useState<string>("ml_threshold");
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();

  const tierConfig = TIER_LIMITS[selectedTier];
  const availableAlertTypes = ALERT_TYPES.filter((at) => tierConfig.types.includes(at.id));
  const selectedAlert = ALERT_TYPES.find((at) => at.id === selectedAlertType) || ALERT_TYPES[0];

  // When tier changes, ensure selected alert type is valid for that tier
  const handleTierChange = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    const newConfig = TIER_LIMITS[tier];
    if (!newConfig.types.includes(selectedAlertType)) {
      setSelectedAlertType(newConfig.types[0]);
    }
  };

  const isAlertAvailable = (alertId: string) => tierConfig.types.includes(alertId);

  return (
    <section className="py-24 relative" id="alert-types">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={cn(
            "text-center mb-12 animate-on-scroll",
            headerVisible && "is-visible"
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Alert types for{" "}
            <span className="text-gradient-amber">every edge</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From basic line alerts to advanced live-game triggers. Choose the alerts that match your betting style.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="flex justify-center mb-8">
          <Tabs value={selectedTier} onValueChange={(v) => handleTierChange(v as SubscriptionTier)}>
            <TabsList className="bg-secondary/50 border border-border h-12 gap-1 p-1">
              {(["rookie", "pro", "legend"] as SubscriptionTier[]).map((tier) => {
                const display = TIER_DISPLAY[tier];
                return (
                  <TabsTrigger
                    key={tier}
                    value={tier}
                    className={cn(
                      "px-6 py-2 text-sm font-medium gap-2 data-[state=active]:shadow-md transition-all",
                      tier === "pro" && "data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400",
                      tier === "legend" && "data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400",
                      tier === "rookie" && "data-[state=active]:bg-background data-[state=active]:text-foreground"
                    )}
                  >
                    {tier === "legend" && <Crown className="w-4 h-4" />}
                    {display.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Tier Info Badge */}
        <div className="flex justify-center mb-8">
          <Badge
            variant="secondary"
            className={cn(
              "text-sm px-4 py-1.5",
              TIER_DISPLAY[selectedTier].bgColor,
              TIER_DISPLAY[selectedTier].color
            )}
          >
            {tierConfig.alerts} • {tierConfig.types.length} alert type{tierConfig.types.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div
          ref={contentRef}
          className={cn(
            "grid md:grid-cols-[280px_1fr] gap-6 max-w-5xl mx-auto animate-on-scroll",
            contentVisible && "is-visible"
          )}
        >
          {/* Alert Type Selector */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3 px-1">
              Available Alerts
            </p>
            <div className="space-y-2">
              {ALERT_TYPES.map((alertType) => {
                const isAvailable = isAlertAvailable(alertType.id);
                const isSelected = selectedAlertType === alertType.id;
                const Icon = alertType.icon;
                const tierDisplay = TIER_DISPLAY[alertType.minTier];

                return (
                  <button
                    key={alertType.id}
                    onClick={() => isAvailable && setSelectedAlertType(alertType.id)}
                    disabled={!isAvailable}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left",
                      "transition-all duration-200",
                      isAvailable
                        ? isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground/30"
                        : "border-border/50 bg-muted/20 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-md shrink-0 transition-colors duration-200",
                        isSelected && isAvailable
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isAvailable ? (
                        <Icon className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium truncate transition-colors duration-200",
                          isSelected && isAvailable ? "text-foreground" : "text-foreground/80"
                        )}>
                          {alertType.shortName}
                        </span>
                        {!isAvailable && (
                          <span className={cn(
                            "text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded",
                            tierDisplay.bgColor,
                            tierDisplay.color
                          )}>
                            {tierDisplay.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && isAvailable && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Detail Panel */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                <selectedAlert.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">{selectedAlert.name}</h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    TIER_DISPLAY[selectedAlert.minTier].bgColor,
                    TIER_DISPLAY[selectedAlert.minTier].color
                  )}
                >
                  {TIER_DISPLAY[selectedAlert.minTier].label}+
                </Badge>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              {selectedAlert.description}
            </p>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Example Alerts
              </p>
              <ul className="space-y-2.5">
                {selectedAlert.examples.map((example, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA based on tier */}
            {selectedTier !== "legend" && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTier === "rookie" 
                    ? "Upgrade to Pro for more alerts and advanced types"
                    : "Upgrade to Legend for unlimited alerts and all alert types"
                  }
                </p>
                <Button
                  variant="ghost"
                  onClick={() => handleTierChange(selectedTier === "rookie" ? "pro" : "legend")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-200",
                    selectedTier === "rookie"
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300"
                      : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300"
                  )}
                >
                  {selectedTier === "rookie" ? "View Pro Plan" : "View Legend Plan"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
