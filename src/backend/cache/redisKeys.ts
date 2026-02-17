const KEY_PREFIX = (process.env.REDIS_KEY_PREFIX || "").trim();

function prefixed(key: string): string {
  return KEY_PREFIX.length > 0 ? `${KEY_PREFIX}:${key}` : key;
}

export const redisKeys = {
  eventStatus: (eventID: string) => prefixed(`odds:event:${eventID}:status`),
  eventBooks: (eventID: string) => prefixed(`odds:event:${eventID}:books`),
  marketBookQuote: (eventID: string, oddID: string, bookmakerID: string) =>
    prefixed(`odds:event:${eventID}:market:${oddID}:book:${bookmakerID}`),
  eventMeta: (eventID: string) => prefixed(`event:${eventID}:meta`),
  eventOddsCore: (eventID: string) => prefixed(`odds:event:${eventID}:odds_core`),
  leagueLiveIndex: (leagueID: string) => prefixed(`idx:league:${leagueID}:live`),
  leagueUpcomingIndex: (leagueID: string) => prefixed(`idx:league:${leagueID}:upcoming`),
  teamLiveIndex: (teamID: string) => prefixed(`idx:team:${teamID}:live`),
  teamUpcomingIndex: (teamID: string) => prefixed(`idx:team:${teamID}:upcoming`),
  pollNextAt: (eventID: string) => prefixed(`poll:event:${eventID}:next_at`),
  alertByEventOddBook: (eventID: string, oddID: string, bookmakerID: string) =>
    prefixed(`alerts:idx:event:${eventID}:odd:${oddID}:book:${bookmakerID}`),
  alertMeta: (alertID: string) => prefixed(`alerts:meta:${alertID}`),
  alertsByUser: (userID: string) => prefixed(`alerts:idx:user:${userID}`),
  streamOddsTicks: () => prefixed("stream:odds_ticks"),
  streamEventStatusTicks: () => prefixed("stream:event_status_ticks"),
  streamNotificationJobs: () => prefixed("stream:notification_jobs"),
  streamAlertDeadLetter: () => prefixed("stream:alert_dead_letter"),
  streamNotificationDeadLetter: () => prefixed("stream:notification_dead_letter"),
};
