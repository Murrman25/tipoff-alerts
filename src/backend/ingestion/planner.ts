import { buildPollingSegments } from "@/backend/ingestion/scheduler";
import { IngestionEventSummary, PollingSegment } from "@/backend/ingestion/types";
import { TokenBucket } from "@/backend/ingestion/tokenBucket";

export interface ScheduledPoll {
  lifecycle: PollingSegment["lifecycle"];
  eventIDs: string[];
}

export function planPollRequests(
  events: IngestionEventSummary[],
  budget: TokenBucket,
  maxEventIdsPerRequest = 25,
): ScheduledPoll[] {
  const plan: ScheduledPoll[] = [];
  const segments = buildPollingSegments(events);

  for (const segment of segments) {
    const chunks = chunk(segment.eventIDs, maxEventIdsPerRequest);
    for (const eventIDs of chunks) {
      if (!budget.consume(1)) {
        return plan;
      }
      plan.push({
        lifecycle: segment.lifecycle,
        eventIDs,
      });
    }
  }

  return plan;
}

function chunk<T>(items: T[], chunkSize: number): T[][] {
  const size = Math.max(1, chunkSize);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
