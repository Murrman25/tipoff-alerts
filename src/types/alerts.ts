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
