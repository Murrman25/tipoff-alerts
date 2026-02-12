import { classifyLifecycle } from "@/backend/ingestion/cohorts";
import { EventLifecycle, IngestionEventSummary, PollCadence, PollingSegment } from "@/backend/ingestion/types";

const CADENCE_BY_LIFECYCLE: Record<EventLifecycle, PollCadence> = {
  live: { minSeconds: 30, maxSeconds: 60 },
  starting_soon: { minSeconds: 60, maxSeconds: 120 },
  upcoming: { minSeconds: 300, maxSeconds: 600 },
  far_future: { minSeconds: 900, maxSeconds: 1800 },
  finalized: { minSeconds: 1800, maxSeconds: 7200 },
};

export function cadenceForLifecycle(lifecycle: EventLifecycle): PollCadence {
  return CADENCE_BY_LIFECYCLE[lifecycle];
}

export function nextPollDelayMs(lifecycle: EventLifecycle, jitterSeed = Math.random()): number {
  const cadence = cadenceForLifecycle(lifecycle);
  const boundedSeed = Math.max(0, Math.min(1, jitterSeed));
  const seconds = cadence.minSeconds + (cadence.maxSeconds - cadence.minSeconds) * boundedSeed;
  return Math.round(seconds * 1000);
}

export function buildPollingSegments(events: IngestionEventSummary[], now = new Date()): PollingSegment[] {
  const buckets: Record<EventLifecycle, string[]> = {
    live: [],
    starting_soon: [],
    upcoming: [],
    far_future: [],
    finalized: [],
  };

  for (const event of events) {
    const lifecycle = classifyLifecycle(event, now);
    buckets[lifecycle].push(event.eventID);
  }

  return (Object.keys(buckets) as EventLifecycle[])
    .filter((lifecycle) => buckets[lifecycle].length > 0)
    .map((lifecycle) => ({
      lifecycle,
      cadence: cadenceForLifecycle(lifecycle),
      eventIDs: buckets[lifecycle],
    }));
}
