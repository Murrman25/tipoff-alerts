import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/types/profile";
import { TIER_CONFIG } from "@/types/profile";

interface TierBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

export const TierBadge = ({ tier, className }: TierBadgeProps) => {
  const config = TIER_CONFIG[tier];

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-semibold",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.name}
    </Badge>
  );
};
