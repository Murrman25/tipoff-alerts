export interface OddsTick {
  type: "ODDS_TICK";
  eventID: string;
  oddID: string;
  bookmakerID: string;
  currentOdds: number;
  line: number | null;
  available: boolean;
  vendorUpdatedAt: string | null;
  observedAt: string;
}

export interface EventStatusTick {
  type: "EVENT_STATUS_TICK";
  eventID: string;
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  cancelled: boolean;
  live: boolean;
  period?: string;
  clock?: string;
  updatedAt?: string;
  vendorUpdatedAt: string | null;
  observedAt: string;
}

export type IngestionTick = OddsTick | EventStatusTick;
