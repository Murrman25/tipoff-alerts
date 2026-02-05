import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
 import { FeatureComparisonTable } from "./FeatureComparisonTable";

const plans = [
  {
    name: "Rookie",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started with basic alerts",
    features: [
      "1 alert per day",
      "Moneyline & spread alerts",
      "Basic alert builder",
      "Push notifications",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 20,
    yearlyPrice: 180, // $15/mo billed yearly (25% off)
    description: "For serious bettors who need more power",
    features: [
      "Up to 5 active alerts",
      "Over/Under & Score Margin alerts",
      "Multi-condition logic (AND/OR)",
      "Email & push notifications",
      "Priority delivery",
      "Line movement history",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Legend",
    monthlyPrice: 40,
    yearlyPrice: 360, // $30/mo billed yearly (25% off)
    description: "Unlimited power for professional use",
    features: [
      "All Pro features",
      "Unlimited active alerts",
      "Timed Line Surge & Momentum alerts",
      "SMS notifications",
      "Auto-rearm alerts",
      "Custom notification channels",
    ],
    cta: "Go Legend",
    highlighted: false,
  },
];

export const Pricing = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return "Free";
    if (isYearly) {
      const monthlyEquivalent = Math.round(plan.yearlyPrice / 12);
      return `$${monthlyEquivalent}`;
    }
    return `$${plan.monthlyPrice}`;
  };

  const getPeriod = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return "forever";
    return "/month";
  };

  return (
    <section className="py-24 relative" id="pricing">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-16 animate-on-scroll",
            headerVisible && "is-visible"
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Simple pricing,{" "}
            <span className="text-gradient-amber">powerful features</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                isYearly ? "bg-primary" : "bg-muted border border-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-sm",
                  isYearly 
                    ? "translate-x-6 bg-primary-foreground" 
                    : "translate-x-0 bg-foreground"
                )}
              />
            </button>
            <span className={cn(
              "text-sm font-medium transition-colors",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Yearly
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
              Save 25%
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative p-8 rounded-xl border transition-all duration-300 animate-on-scroll flex flex-col",
                plan.highlighted
                  ? "bg-card border-primary/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] scale-105"
                  : "bg-card border-border hover:border-primary/30",
                gridVisible && "is-visible",
                `stagger-${index + 1}`
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-gradient text-primary-foreground text-xs font-semibold">
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  plan.name === "Pro" && "text-amber-400",
                  plan.name === "Legend" && "text-purple-400"
                )}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span 
                    key={isYearly ? "yearly" : "monthly"}
                    className={cn(
                      "text-4xl font-bold animate-fade-in",
                      plan.highlighted && "text-gradient-amber"
                    )}
                  >
                    {formatPrice(plan)}
                  </span>
                  <span className="text-muted-foreground">{getPeriod(plan)}</span>
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed ${plan.yearlyPrice}/year
                  </p>
                )}
                <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={cn(
                      "w-5 h-5 shrink-0 mt-0.5",
                      plan.name === "Legend" && featureIndex === 0 ? "text-primary" : "text-primary"
                    )} />
                    <span className={cn(
                      "text-sm",
                      plan.name === "Legend" && featureIndex === 0 && "text-primary font-medium"
                    )}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "w-full mt-auto",
                  plan.highlighted
                    ? "bg-amber-gradient text-primary-foreground hover:opacity-90"
                    : "border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
                )}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
 
        {/* Feature Comparison Table */}
        <FeatureComparisonTable />
      </div>
    </section>
  );
};
