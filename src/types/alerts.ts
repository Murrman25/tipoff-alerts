export type RuleType = 
  | 'ml_threshold' 
  | 'spread_threshold' 
  | 'ou_threshold' 
  | 'score_margin' 
  | 'timed_surge' 
  | 'momentum_run';

export type MarketType = 'ml' | 'sp' | 'ou';

export type DirectionType = 
  | 'at_or_above' 
  | 'at_or_below' 
  | 'exactly' 
  | 'crosses_above' 
  | 'crosses_below';

export type TimeWindow = 'pregame' | 'live' | 'both';

export type PlanTier = 'rookie' | 'pro' | 'legend';

export interface AlertCondition {
  ruleType: RuleType;
  eventID: string | null;
  marketType: MarketType;
  teamSide: 'home' | 'away' | null;
  threshold: number | null;
  direction: DirectionType | null;
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
    id: 'ml_threshold',
    name: 'Moneyline Alerts',
    description: 'Set your number and let TipOff HQ watch the line. Get alerted the moment moneyline odds hit your target.',
    planRequired: 'rookie',
  },
  {
    id: 'spread_threshold',
    name: 'Spread Alerts',
    description: 'Don\'t force the number — wait for it. Spread Alerts notify you when live spreads move into your predefined range.',
    planRequired: 'rookie',
  },
  {
    id: 'ou_threshold',
    name: 'O/U Alerts',
    description: 'Set the total you want and let TipOff HQ track live scoring for you. Get alerted the moment the live total reaches or crosses your target.',
    planRequired: 'pro',
  },
  {
    id: 'score_margin',
    name: 'Score Margin Alert',
    description: 'Watch the scoreboard — without watching the scoreboard. Score Margin Alerts notify you when game flow reaches your predefined differential.',
    planRequired: 'pro',
  },
  {
    id: 'timed_surge',
    name: 'Line Surge Alert',
    description: 'Get alerted when odds move aggressively in a short time window. TipOff HQ tracks sharp line changes and notifies you when a surge occurs.',
    planRequired: 'legend',
  },
  {
    id: 'momentum_run',
    name: 'Momentum Run Alert',
    description: 'Track scoring runs and momentum swings in real time. TipOff HQ alerts you when one team goes on a defined run within a given amount of time.',
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
    name: 'Spread Move',
    description: 'Alert on spread movement',
    icon: 'GitCompareArrows',
    defaults: {
      ruleType: 'spread_threshold',
      marketType: 'sp',
      timeWindow: 'both',
    },
    requiredFields: ['eventID', 'teamSide', 'threshold', 'direction'],
  },
  {
    id: 'odds_drop',
    name: 'Odds Drop',
    description: 'Moneyline drops below target',
    icon: 'Target',
    defaults: {
      ruleType: 'ml_threshold',
      marketType: 'ml',
      direction: 'crosses_below',
      timeWindow: 'pregame',
    },
    requiredFields: ['eventID', 'teamSide', 'threshold'],
  },
  {
    id: 'best_price',
    name: 'Score Margin',
    description: 'Track game flow differential',
    icon: 'Target',
    defaults: {
      ruleType: 'score_margin',
      timeWindow: 'live',
    },
    requiredFields: ['eventID', 'teamSide', 'threshold', 'direction'],
  },
  {
    id: 'going_live',
    name: 'Line Surge',
    description: 'Sharp odds movement detected',
    icon: 'Timer',
    defaults: {
      ruleType: 'timed_surge',
      marketType: 'ml',
      timeWindow: 'live',
    },
    requiredFields: ['eventID', 'teamSide'],
  },
];

// Help content for fields
export const FIELD_HELP_CONTENT: Record<string, { title: string; description: string; example?: string }> = {
  ruleType: {
    title: 'Alert Type',
    description: 'Choose your alert type. Moneyline and Spread track betting lines. Score Margin and Momentum track game flow.',
    example: 'Use Spread Alert to watch for line movement to +3.5',
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
