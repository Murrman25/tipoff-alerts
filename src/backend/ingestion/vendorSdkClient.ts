import SportsGameOdds from "sports-odds-api";

import {
  VendorEventsClient,
  VendorGetEventsParams,
  VendorGetEventsResponse,
} from "@/backend/ingestion/types";

export class SportsGameOddsSdkClient<TEvent = unknown> implements VendorEventsClient<TEvent> {
  private client: SportsGameOdds;

  constructor(apiKey: string) {
    this.client = new SportsGameOdds({
      apiKeyHeader: apiKey,
      maxRetries: 2,
      timeout: 20 * 1000,
    });
  }

  async getEvents(params: VendorGetEventsParams): Promise<VendorGetEventsResponse<TEvent>> {
    const page = await this.client.events.get({
      ...params,
    });

    return {
      data: (page.data || []) as TEvent[],
      nextCursor: "nextCursor" in page && typeof page.nextCursor === "string" ? page.nextCursor : undefined,
    };
  }
}
