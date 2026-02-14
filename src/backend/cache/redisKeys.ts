export const redisKeys = {
  eventStatus: (eventID: string) => `odds:event:${eventID}:status`,
  eventBooks: (eventID: string) => `odds:event:${eventID}:books`,
  marketBookQuote: (eventID: string, oddID: string, bookmakerID: string) =>
    `odds:event:${eventID}:market:${oddID}:book:${bookmakerID}`,
  alertByEventOddBook: (eventID: string, oddID: string, bookmakerID: string) =>
    `alerts:idx:event:${eventID}:odd:${oddID}:book:${bookmakerID}`,
  alertMeta: (alertID: string) => `alerts:meta:${alertID}`,
  alertsByUser: (userID: string) => `alerts:idx:user:${userID}`,
  streamOddsTicks: () => "stream:odds_ticks",
  streamEventStatusTicks: () => "stream:event_status_ticks",
  streamNotificationJobs: () => "stream:notification_jobs",
  streamAlertDeadLetter: () => "stream:alert_dead_letter",
  streamNotificationDeadLetter: () => "stream:notification_dead_letter",
};
