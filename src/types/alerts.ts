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
  | 'exactly';

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
    showThreshold: true,
    showDirection: false,
    showTimeWindow: false,
    showSurgeWindow: true,
    showRunWindow: false,
    showGamePeriod: true,
    forceTimeWindow: 'live',
    thresholdLabel: 'Target Value',
    thresholdPlaceholder: 'Enter target line',
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
      direction: 'at_or_below',
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

// User-created alert template (stored in database)
export interface AlertTemplate {
  id: string;
  user_id: string;
  name: string;
  rule_type: RuleType;
  market_type: MarketType;
  threshold: number | null;
  direction: DirectionType | null;
  surge_window_minutes: number | null;
  run_window_minutes: number | null;
  game_period: GamePeriod | null;
  time_window: TimeWindow;
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating templates (excludes auto-generated fields)
export type AlertTemplateInput = Omit<AlertTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Help content for fields
export const FIELD_HELP_CONTENT: Record<string, { title: string; description: string; example?: string }> = {
  ruleType: {
    title: 'Alert Type',
    description: 'Choose how to monitor the game. Moneyline, Spread, and O/U track betting lines. Score Margin tracks point differentials. Line Surge detects rapid line movement. Momentum tracks scoring runs.',
    example: 'Use "Spread" to watch for line movement to +3.5',
  },
  threshold: {
    title: 'Target Value',
    description: 'The value that triggers your alert. For Moneyline: odds like +150 or -110. For Spread: points like +3.5 or -7. For O/U: total points like 224.5. For Score Margin: point lead like 10. For Momentum: run size like 8.',
    example: 'Moneyline +150 means underdog odds of +150',
  },
  direction: {
    title: 'Trigger Direction',
    description: 'Determines when your alert fires. "At or above" triggers when the value is greater than or equal to your target. "At or below" triggers when less than or equal.',
    example: '"At or above +3" alerts when spread is +3, +3.5, +4...',
  },
  marketType: {
    title: 'Market Type',
    description: 'For Line Surge alerts, choose which betting market to monitor. Moneyline = who wins outright. Spread = point margin. Over/Under = total combined points.',
    example: 'Track ML surges to catch sharp money movement',
  },
  surgeWindow: {
    title: 'Surge Detection Window',
    description: 'How quickly the line must move to trigger a surge alert. Shorter windows catch sharper, more sudden movements. Longer windows catch gradual drifts.',
    example: '5 min catches sharp moves, 30 min catches gradual shifts',
  },
  runWindow: {
    title: 'Scoring Run Window',
    description: 'Time frame to track unanswered points. Detects when one team goes on a scoring run without the opponent scoring.',
    example: '5 min window catches 10-0 runs within 5 minutes',
  },
  gamePeriod: {
    title: 'Game Period',
    description: 'Which part of the game to monitor. "Full Game" tracks the entire game. Quarter/Half/Period options focus on specific segments.',
    example: 'Track 4th quarter momentum to catch late-game swings',
  },
  timeWindow: {
    title: 'Alert Timing',
    description: 'When your alert can trigger. "Pregame" = only before the game starts. "Live" = only during the game. "Pregame & Live" = anytime.',
    example: 'Use "Live-only" to ignore pregame line movements',
  },
  teamSide: {
    title: 'Team Selection',
    description: 'Which team to track for this alert. The alert monitors this team\'s odds, spread, or score depending on your alert type.',
  },
};
