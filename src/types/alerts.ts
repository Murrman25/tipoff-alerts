export type RuleType = 
  | 'threshold_at' 
  | 'threshold_cross' 
  | 'value_change' 
  | 'percentage_move' 
  | 'best_available' 
  | 'arbitrage';

export type MarketType = 'ml' | 'sp' | 'ou';

export type DirectionType = 
  | 'at_or_above' 
  | 'at_or_below' 
  | 'exactly' 
  | 'crosses_above' 
  | 'crosses_below';

export type TimeWindow = 'pregame' | 'live' | 'both';

export type PlanTier = 'free' | 'pro' | 'legend';

export interface AlertCondition {
  ruleType: RuleType;
  eventID: string | null;
  marketType: MarketType;
  teamSide: 'home' | 'away' | null;
  threshold: number | null;
  direction: DirectionType;
  timeWindow: TimeWindow;
}

export interface RuleTypeOption {
  id: RuleType;
  name: string;
  description: string;
  planRequired: PlanTier;
}

export const RULE_TYPE_OPTIONS: RuleTypeOption[] = [
  {
    id: 'threshold_at',
    name: 'Threshold At',
    description: 'Alert when a value reaches a specific number',
    planRequired: 'free',
  },
  {
    id: 'threshold_cross',
    name: 'Threshold Cross',
    description: 'Alert when a value crosses above or below a line',
    planRequired: 'free',
  },
  {
    id: 'value_change',
    name: 'Value Change',
    description: 'Alert on any movement in odds or lines',
    planRequired: 'pro',
  },
  {
    id: 'percentage_move',
    name: 'Percentage Move',
    description: 'Alert when odds shift by a percentage',
    planRequired: 'pro',
  },
  {
    id: 'best_available',
    name: 'Best Available',
    description: 'Alert when a line becomes best across books',
    planRequired: 'pro',
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage',
    description: 'Alert on arbitrage opportunities',
    planRequired: 'legend',
  },
];

export const MARKET_OPTIONS = [
  { id: 'ml' as MarketType, name: 'Moneyline', abbreviation: 'ML' },
  { id: 'sp' as MarketType, name: 'Spread', abbreviation: 'SP' },
  { id: 'ou' as MarketType, name: 'Over/Under', abbreviation: 'O/U' },
];

export const DIRECTION_OPTIONS = [
  { id: 'at_or_above' as DirectionType, name: 'At or above' },
  { id: 'at_or_below' as DirectionType, name: 'At or below' },
  { id: 'exactly' as DirectionType, name: 'Exactly at' },
  { id: 'crosses_above' as DirectionType, name: 'Crosses above' },
  { id: 'crosses_below' as DirectionType, name: 'Crosses below' },
];

// Quick Alert Templates
export type QuickAlertTemplateId = 'line_move' | 'odds_drop' | 'best_price' | 'going_live';

export interface QuickAlertTemplate {
  id: QuickAlertTemplateId;
  name: string;
  description: string;
  icon: string;
  defaults: Partial<AlertCondition>;
  requiredFields: (keyof AlertCondition)[];
}

export const QUICK_ALERT_TEMPLATES: QuickAlertTemplate[] = [
  {
    id: 'line_move',
    name: 'Line Move',
    description: 'Alert on any spread movement',
    icon: 'TrendingUp',
    defaults: {
      ruleType: 'value_change',
      marketType: 'sp',
      timeWindow: 'both',
    },
    requiredFields: ['eventID', 'teamSide'],
  },
  {
    id: 'odds_drop',
    name: 'Odds Drop',
    description: 'Moneyline drops below target',
    icon: 'TrendingDown',
    defaults: {
      ruleType: 'threshold_cross',
      marketType: 'ml',
      direction: 'crosses_below',
      timeWindow: 'pregame',
    },
    requiredFields: ['eventID', 'teamSide', 'threshold'],
  },
  {
    id: 'best_price',
    name: 'Best Price',
    description: 'Best odds across all books',
    icon: 'Trophy',
    defaults: {
      ruleType: 'best_available',
      timeWindow: 'both',
    },
    requiredFields: ['eventID', 'teamSide', 'marketType'],
  },
  {
    id: 'going_live',
    name: 'Going Live',
    description: 'Game starts live betting',
    icon: 'Radio',
    defaults: {
      ruleType: 'value_change',
      marketType: 'ml',
      timeWindow: 'live',
    },
    requiredFields: ['eventID'],
  },
];

// Help content for fields
export const FIELD_HELP_CONTENT: Record<string, { title: string; description: string; example?: string }> = {
  ruleType: {
    title: 'Alert Trigger',
    description: 'Choose when to trigger your alert. "Threshold At" fires when a line reaches a value. "Value Change" fires on any movement.',
    example: 'Use Threshold At to alert when spread hits +3.5',
  },
  marketType: {
    title: 'Market Type',
    description: 'Moneyline = who wins. Spread = margin of victory. Over/Under = total points scored.',
    example: 'Spread of -7 means team must win by 7+',
  },
  direction: {
    title: 'Direction',
    description: 'Above/below determines which direction triggers the alert relative to your threshold.',
    example: '"At or above +3" alerts when line is +3, +3.5, +4...',
  },
  timeWindow: {
    title: 'Time Window',
    description: 'Pregame = before game starts. Live = during the game. Both = either phase.',
    example: 'Live-only alerts ignore pregame line movements',
  },
  threshold: {
    title: 'Threshold Value',
    description: 'The specific line or odds value that triggers your alert.',
    example: 'Enter -110 for odds or +3.5 for spread',
  },
  teamSide: {
    title: 'Team Selection',
    description: 'Select which team\'s line you want to track.',
  },
};
