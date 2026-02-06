import { SportID } from './games';

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

export type GamePeriod = 
  | 'full_game'
  | '1h' | '2h' 
  | '1q' | '2q' | '3q' | '4q'
  | '1p' | '2p' | '3p'
  | 'current';

export interface AlertCondition {
  ruleType: RuleType;
  eventID: string | null;
  marketType: MarketType;
  teamSide: 'home' | 'away' | null;
  threshold: number | null;
  direction: DirectionType | null;
  timeWindow: TimeWindow;
  surgeWindowMinutes?: number;
  runWindowMinutes?: number;
  gamePeriod?: GamePeriod;
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
    name: 'Moneyline',
    description: '',
    planRequired: 'rookie',
  },
  {
    id: 'spread_threshold',
    name: 'Spread',
    description: '',
    planRequired: 'rookie',
  },
  {
    id: 'ou_threshold',
    name: 'O/U',
    description: '',
    planRequired: 'pro',
  },
  {
    id: 'score_margin',
    name: 'Score Margin',
    description: '',
    planRequired: 'pro',
  },
  {
    id: 'timed_surge',
    name: 'Line Surge',
    description: '',
    planRequired: 'legend',
  },
  {
    id: 'momentum_run',
    name: 'Momentum',
    description: '',
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

// Alert Type Field Configuration
export interface AlertTypeFieldConfig {
  showMarketToggle: boolean;
  showTeamSelector: boolean;
  showThreshold: boolean;
  showDirection: boolean;
  showTimeWindow: boolean;
  showSurgeWindow: boolean;
  showRunWindow: boolean;
  showGamePeriod: boolean;
  forceTimeWindow?: TimeWindow;
  forceMarketType?: MarketType;
  thresholdLabel?: string;
  thresholdPlaceholder?: string;
}

export const ALERT_TYPE_FIELD_CONFIG: Record<RuleType, AlertTypeFieldConfig> = {
  ml_threshold: {
    showMarketToggle: false,
    showTeamSelector: true,
    showThreshold: true,
    showDirection: true,
    showTimeWindow: true,
    showSurgeWindow: false,
    showRunWindow: false,
    showGamePeriod: false,
    forceMarketType: 'ml',
    thresholdLabel: 'Target Odds',
    thresholdPlaceholder: '+150 or -110',
  },
  spread_threshold: {
    showMarketToggle: false,
    showTeamSelector: true,
    showThreshold: true,
    showDirection: true,
    showTimeWindow: true,
    showSurgeWindow: false,
    showRunWindow: false,
    showGamePeriod: false,
    forceMarketType: 'sp',
    thresholdLabel: 'Target Spread',
    thresholdPlaceholder: '+3.5 or -7',
  },
  ou_threshold: {
    showMarketToggle: false,
    showTeamSelector: false,
    showThreshold: true,
    showDirection: true,
    showTimeWindow: true,
    showSurgeWindow: false,
    showRunWindow: false,
    showGamePeriod: false,
    forceMarketType: 'ou',
    thresholdLabel: 'Target Total',
    thresholdPlaceholder: '224.5',
  },
  score_margin: {
    showMarketToggle: false,
    showTeamSelector: true,
    showThreshold: true,
    showDirection: true,
    showTimeWindow: false,
    showSurgeWindow: false,
    showRunWindow: false,
    showGamePeriod: true,
    forceTimeWindow: 'live',
    thresholdLabel: 'Point Margin',
    thresholdPlaceholder: '10 or 15',
  },
  timed_surge: {
    showMarketToggle: true,
    showTeamSelector: true,
    showThreshold: false,
    showDirection: false,
    showTimeWindow: false,
    showSurgeWindow: true,
    showRunWindow: false,
    showGamePeriod: true,
    forceTimeWindow: 'live',
  },
  momentum_run: {
    showMarketToggle: false,
    showTeamSelector: true,
    showThreshold: true,
    showDirection: false,
    showTimeWindow: false,
    showSurgeWindow: false,
    showRunWindow: true,
    showGamePeriod: true,
    forceTimeWindow: 'live',
    thresholdLabel: 'Run Size (points)',
    thresholdPlaceholder: '8, 10, or 12',
  },
};

// Sport-specific game periods
export const SPORT_PERIODS: Record<SportID, { id: GamePeriod; name: string }[]> = {
  BASKETBALL: [
    { id: 'full_game', name: 'Full Game' },
    { id: '1h', name: '1st Half' },
    { id: '2h', name: '2nd Half' },
    { id: '1q', name: '1st Quarter' },
    { id: '2q', name: '2nd Quarter' },
    { id: '3q', name: '3rd Quarter' },
    { id: '4q', name: '4th Quarter' },
  ],
  FOOTBALL: [
    { id: 'full_game', name: 'Full Game' },
    { id: '1h', name: '1st Half' },
    { id: '2h', name: '2nd Half' },
    { id: '1q', name: '1st Quarter' },
    { id: '2q', name: '2nd Quarter' },
    { id: '3q', name: '3rd Quarter' },
    { id: '4q', name: '4th Quarter' },
  ],
  HOCKEY: [
    { id: 'full_game', name: 'Full Game' },
    { id: '1p', name: '1st Period' },
    { id: '2p', name: '2nd Period' },
    { id: '3p', name: '3rd Period' },
  ],
  BASEBALL: [
    { id: 'full_game', name: 'Full Game' },
  ],
  SOCCER: [
    { id: 'full_game', name: 'Full Game' },
    { id: '1h', name: '1st Half' },
    { id: '2h', name: '2nd Half' },
  ],
  TENNIS: [
    { id: 'full_game', name: 'Full Match' },
  ],
  GOLF: [
    { id: 'full_game', name: 'Full Tournament' },
  ],
};

// Surge window preset options
export const SURGE_WINDOW_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];

// Run window preset options  
export const RUN_WINDOW_OPTIONS = [
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
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
      gamePeriod: 'full_game',
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
      surgeWindowMinutes: 15,
      gamePeriod: 'full_game',
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
  surgeWindow: {
    title: 'Surge Window',
    description: 'How quickly the line must move to trigger a surge alert.',
    example: 'A 15-minute window catches rapid line movement',
  },
  runWindow: {
    title: 'Run Window',
    description: 'Time frame to track unanswered points.',
    example: 'A 5-minute window tracks scoring runs',
  },
  gamePeriod: {
    title: 'Game Period',
    description: 'Which part of the game to monitor.',
    example: 'Track 4th quarter momentum shifts',
  },
};
