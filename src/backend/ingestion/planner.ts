import { buildPollingSegments } from "@/backend/ingestion/scheduler";
import { IngestionEventSummary, PollingSegment } from "@/backend/ingestion/types";
import { TokenBucket } from "@/backend/ingestion/tokenBucket";
import { RedisLikeClient } from "@/backend/cache/redisClient";
import { redisKeys } from "@/backend/cache/redisKeys";
import { nextPollDelayMs } from "@/backend/ingestion/scheduler";

export interface ScheduledPoll {
  lifecycle: PollingSegment["lifecycle"];
  eventIDs: string[];
  nextPollAtByEventID: Record<string, number>;
}

export async function planPollRequests(
  events: IngestionEventSummary[],
  budget: TokenBucket,
  maxEventIdsPerRequest = 25,
  redis?: RedisLikeClient,
  nowMs = Date.now(),
): ScheduledPoll[] {
  const plan: ScheduledPoll[] = [];
  const segments = buildPollingSegments(events);

  const dueByEventID = new Map<string, boolean>();
  if (redis && events.length > 0) {
    const keys = events.map((event) => redisKeys.pollNextAt(event.eventID));
    const values = await redis.mget(keys);
    for (let i = 0; i < events.length; i += 1) {
      const raw = values[i];
      const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
      const due = !Number.isFinite(parsed) || parsed <= nowMs;
      dueByEventID.set(events[i].eventID, due);
    }
  } else {
    for (const event of events) {
      dueByEventID.set(event.eventID, true);
    }
  }

  for (const segment of segments) {
    const dueEventIDs = segment.eventIDs.filter((eventID) => dueByEventID.get(eventID) !== false);
    if (dueEventIDs.length === 0) {
      continue;
    }

    const chunks = chunk(dueEventIDs, maxEventIdsPerRequest);
    for (const eventIDs of chunks) {
      if (!budget.consume(1)) {
        return plan;
      }

      const nextPollAtByEventID: Record<string, number> = {};
      for (const eventID of eventIDs) {
        // Use jittered cadence per lifecycle to avoid thundering herds.
        const delayMs = nextPollDelayMs(segment.lifecycle);
        nextPollAtByEventID[eventID] = nowMs + delayMs;
      }
      plan.push({
        lifecycle: segment.lifecycle,
        eventIDs,
        nextPollAtByEventID,
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
