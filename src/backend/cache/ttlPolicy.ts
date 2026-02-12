const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

export function ttlForEventStatus(params: {
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  if (params.ended || params.finalized) {
    return 90 * ONE_MINUTE;
  }

  if (params.started && !params.ended) {
    return 3 * ONE_MINUTE;
  }

  const startsAtMs = new Date(params.startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) {
    return 10 * ONE_MINUTE;
  }

  const deltaSeconds = Math.max(0, (startsAtMs - now.getTime()) / 1000);
  if (deltaSeconds > ONE_DAY) {
    return 45 * ONE_MINUTE;
  }
  if (deltaSeconds > 2 * ONE_HOUR) {
    return 10 * ONE_MINUTE;
  }
  return 5 * ONE_MINUTE;
}
