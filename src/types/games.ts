// Types matching the SportsGameOdds API structure

export interface Team {
  teamID: string;
  name: string;
  abbreviation?: string;
  logo?: string;
}

export interface EventStatus {
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  period?: string;
  clock?: string;
}

export interface BookmakerOdds {
  odds: string;
  available: boolean;
  spread?: string;
  overUnder?: string;
  deeplink?: string;
  altLines?: {
    odds: string;
    available: boolean;
    spread?: string;
    overUnder?: string;
    lastUpdatedAt?: string;
  }[];
}

export interface OddData {
  byBookmaker: Record<string, BookmakerOdds>;
}

export interface GameEvent {
  eventID: string;
  sportID: SportID;
  leagueID: LeagueID;
  teams: {
    home: Team;
    away: Team;
  };
  status: EventStatus;
  odds: Record<string, OddData>;
  score?: {
    home: number;
    away: number;
  };
}

export type SportID = 'BASKETBALL' | 'FOOTBALL' | 'SOCCER' | 'HOCKEY' | 'TENNIS' | 'GOLF' | 'BASEBALL';

export type LeagueID = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'EPL' | 'UEFA_CHAMPIONS_LEAGUE' | 'NCAAB' | 'NCAAF';

export type BookmakerID = 'draftkings' | 'fanduel' | 'bet365' | 'circa' | 'caesars' | 'betmgm' | 'betonline' | 'prizepicks' | 'pinnacle';

export type BetTypeID = 'ml' | 'sp' | 'ou' | 'eo' | 'yn' | 'ml3way';

export type PeriodID = 'game' | '1h' | '2h' | '1q' | '2q' | '3q' | '4q';

export interface GamesFilters {
  leagueID: LeagueID[];
  bookmakerID: BookmakerID[];
  betTypeID: BetTypeID[];
  searchQuery: string;
  dateRange: 'today' | 'tomorrow' | 'week' | 'all';
  oddsAvailable: boolean;
}

// Display metadata for filters
export const LEAGUES: { id: LeagueID; name: string; sport: SportID }[] = [
  { id: 'NFL', name: 'NFL', sport: 'FOOTBALL' },
  { id: 'NBA', name: 'NBA', sport: 'BASKETBALL' },
  { id: 'MLB', name: 'MLB', sport: 'BASEBALL' },
  { id: 'NHL', name: 'NHL', sport: 'HOCKEY' },
  { id: 'NCAAB', name: 'NCAAB', sport: 'BASKETBALL' },
  { id: 'NCAAF', name: 'NCAAF', sport: 'FOOTBALL' },
];

export const BOOKMAKERS: { id: BookmakerID; name: string }[] = [
  { id: 'draftkings', name: 'DraftKings' },
  { id: 'fanduel', name: 'FanDuel' },
  { id: 'betmgm', name: 'BetMGM' },
  { id: 'caesars', name: 'Caesars' },
  { id: 'bet365', name: 'Bet365' },
  { id: 'pinnacle', name: 'Pinnacle' },
];

export const BET_TYPES: { id: BetTypeID; name: string; description: string }[] = [
  { id: 'ml', name: 'Moneyline', description: 'Pick the winner' },
  { id: 'sp', name: 'Spread', description: 'Point spread betting' },
  { id: 'ou', name: 'Over/Under', description: 'Total points betting' },
];

export const DATE_RANGES: { id: GamesFilters['dateRange']; name: string }[] = [
  { id: 'today', name: 'Today' },
  { id: 'tomorrow', name: 'Tomorrow' },
  { id: 'week', name: 'This Week' },
  { id: 'all', name: 'All Upcoming' },
];
