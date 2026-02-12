export interface IngestionEventSummary {
  eventID: string;
  leagueID: string;
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
}

export type EventLifecycle = "live" | "starting_soon" | "upcoming" | "far_future" | "finalized";

export interface PollCadence {
  minSeconds: number;
  maxSeconds: number;
}

export interface PollingSegment {
  lifecycle: EventLifecycle;
  cadence: PollCadence;
  eventIDs: string[];
}

export interface VendorGetEventsParams {
  leagueID?: string;
  eventID?: string;
  eventIDs?: string;
  oddID?: string;
  bookmakerID?: string;
  oddsAvailable?: boolean;
  includeAltLines?: boolean;
  live?: boolean;
  started?: boolean;
  finalized?: boolean;
  limit?: number;
  cursor?: string;
}

export interface VendorGetEventsResponse<TEvent> {
  data: TEvent[];
  nextCursor?: string;
}

export interface VendorEventsClient<TEvent = unknown> {
  getEvents(params: VendorGetEventsParams): Promise<VendorGetEventsResponse<TEvent>>;
}

export interface VendorMarketBookOdds {
  odds?: string;
  available?: boolean;
  spread?: string;
  overUnder?: string;
}

export interface VendorIngestionEvent {
  eventID: string;
  leagueID: string;
  status?: {
    startsAt?: string;
    started?: boolean;
    ended?: boolean;
    finalized?: boolean;
    cancelled?: boolean;
    updatedAt?: string;
  };
  odds?: Record<
    string,
    {
      byBookmaker?: Record<string, VendorMarketBookOdds>;
    }
  >;
}
