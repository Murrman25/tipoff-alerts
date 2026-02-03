export type SubscriptionTier = 'rookie' | 'pro' | 'legend';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface UserFavoriteTeam {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
}

export interface TierConfig {
  name: string;
  color: string;
  bgColor: string;
  features: string[];
  canUpgrade: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  rookie: {
    name: "Rookie",
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    features: [
      "1 active alert per day",
      "Basic alert builder",
      "Email notifications",
      "Access to all sports",
    ],
    canUpgrade: true,
  },
  pro: {
    name: "Pro",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    features: [
      "15 alerts per day",
      "Multi-condition logic (AND/OR)",
      "Alert templates",
      "Priority notification delivery",
      "Advanced filters",
      "Line movement history",
    ],
    canUpgrade: true,
  },
  legend: {
    name: "Legend",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    features: [
      "Unlimited alerts",
      "Auto-rearm alerts",
      "Advanced configurations",
      "API access",
      "Priority support",
      "Custom notification channels",
      "Early access to new features",
    ],
    canUpgrade: false,
  },
};
