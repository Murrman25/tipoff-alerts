import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const plans = [
  {
    name: "Rookie",
    price: "Free",
    period: "forever",
    description: "Perfect for getting started with basic alerts",
    features: [
      "1 active alert per day",
      "Basic alert builder",
      "Email notifications",
      "Access to all sports",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "For serious bettors who need more power",
    features: [
      "15 alerts per day",
      "Multi-condition logic (AND/OR)",
      "Alert templates",
      "Priority notification delivery",
      "Advanced filters",
      "Line movement history",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Legend",
    price: "$40",
    period: "/month",
    description: "Unlimited power for professional use",
    features: [
      "Unlimited alerts",
      "Auto-rearm alerts",
      "Advanced configurations",
      "API access",
      "Priority support",
      "Custom notification channels",
      "Early access to new features",
    ],
    cta: "Go Legend",
    highlighted: false,
  },
];

export const Pricing = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free and upgrade as you grow. No hidden fees.
          </p>
        </div>

        {/* Pricing cards */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative p-8 rounded-xl border transition-all duration-300 animate-on-scroll",
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
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-4xl font-bold",
                    plan.highlighted && "text-gradient-amber"
                  )}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "w-full",
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
      </div>
    </section>
  );
};
