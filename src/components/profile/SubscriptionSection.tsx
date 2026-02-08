import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles } from "lucide-react";
import { TierBadge } from "./TierBadge";
import type { SubscriptionTier } from "@/types/profile";
import { TIER_CONFIG } from "@/types/profile";

interface SubscriptionSectionProps {
  tier: SubscriptionTier;
}

export const SubscriptionSection = ({ tier }: SubscriptionSectionProps) => {
  const config = TIER_CONFIG[tier];
  const nextTier: SubscriptionTier | null =
    tier === "rookie" ? "pro" : tier === "pro" ? "legend" : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="w-5 h-5 text-amber-400" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} className="text-base px-3 py-1" />
          <span className="text-muted-foreground">Current Plan</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Your Benefits:</p>
          <ul className="space-y-1.5">
            {config.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {config.canUpgrade && nextTier && (
          <Button className="w-full bg-gold-gradient text-primary-foreground hover:opacity-90">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to {TIER_CONFIG[nextTier].name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
