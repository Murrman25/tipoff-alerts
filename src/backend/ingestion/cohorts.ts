import { EventLifecycle, IngestionEventSummary } from "@/backend/ingestion/types";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export function classifyLifecycle(event: IngestionEventSummary, now = new Date()): EventLifecycle {
  if (event.ended || event.finalized) {
    return "finalized";
  }

  if (event.started && !event.ended) {
    return "live";
  }

  const startsAtMs = new Date(event.startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) {
    return "upcoming";
  }

  const delta = startsAtMs - now.getTime();
  if (delta <= 2 * ONE_HOUR_MS) {
    return "starting_soon";
  }
  if (delta <= ONE_DAY_MS) {
    return "upcoming";
  }
  return "far_future";
}
