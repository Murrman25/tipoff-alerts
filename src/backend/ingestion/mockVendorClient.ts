import {
  VendorIngestionEvent,
  VendorEventsClient,
  VendorGetEventsParams,
  VendorGetEventsResponse,
} from "@/backend/ingestion/types";

export class MockVendorEventsClient<TEvent extends VendorIngestionEvent>
  implements VendorEventsClient<TEvent> {
  constructor(private readonly data: TEvent[]) {}

  async getEvents(params: VendorGetEventsParams): Promise<VendorGetEventsResponse<TEvent>> {
    let filtered = this.data;

    if (params.eventIDs) {
      const idSet = new Set(params.eventIDs.split(","));
      filtered = filtered.filter((event) => idSet.has(String(event.eventID)));
    }

    if (params.live !== undefined) {
      filtered = filtered.filter(
        (event) => {
          const isLive = event.status?.started === true && event.status?.ended !== true;
          return isLive === params.live;
        },
      );
    }

    if (params.started !== undefined) {
      filtered = filtered.filter((event) => Boolean(event.status?.started) === params.started);
    }

    const limit = params.limit ?? filtered.length;
    return {
      data: filtered.slice(0, limit),
    };
  }
}
