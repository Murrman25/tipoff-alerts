import { RedisLikeClient } from "@/backend/cache/redisClient";
import { redisKeys } from "@/backend/cache/redisKeys";
import { ttlForEventStatus } from "@/backend/cache/ttlPolicy";
import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";
import { parseVendorBookmakerOdds } from "@/backend/odds/parseAmericanOdds";

export interface OddsQuoteSnapshot {
  eventID: string;
  oddID: string;
  bookmakerID: string;
  odds: string | null | undefined;
  spread?: string | null;
  overUnder?: string | null;
  available?: boolean;
  startsAt: string;
  started: boolean;
  ended: boolean;
  finalized: boolean;
  vendorUpdatedAt: string | null;
  observedAt: string;
}

export class RedisIngestionSink {
  constructor(private readonly redis: RedisLikeClient) {}

  async writeOddsQuote(snapshot: OddsQuoteSnapshot): Promise<OddsTick | null> {
    const parsed = parseVendorBookmakerOdds({
      odds: snapshot.odds,
      available: snapshot.available ?? false,
      spread: snapshot.spread ?? null,
      overUnder: snapshot.overUnder ?? null,
    });

    if (parsed.currentOdds === null) {
      return null;
    }

    const tick: OddsTick = {
      type: "ODDS_TICK",
      eventID: snapshot.eventID,
      oddID: snapshot.oddID,
      bookmakerID: snapshot.bookmakerID,
      currentOdds: parsed.currentOdds,
      line: parsed.line,
      available: parsed.available,
      vendorUpdatedAt: snapshot.vendorUpdatedAt,
      observedAt: snapshot.observedAt,
    };

    const quoteKey = redisKeys.marketBookQuote(snapshot.eventID, snapshot.oddID, snapshot.bookmakerID);
    const ttl = ttlForEventStatus({
      startsAt: snapshot.startsAt,
      started: snapshot.started,
      ended: snapshot.ended,
      finalized: snapshot.finalized,
    });

    await this.redis.set(
      quoteKey,
      JSON.stringify({
        ...tick,
        source: "ingestion-worker",
      }),
      ttl,
    );
    await this.redis.sadd(redisKeys.eventBooks(snapshot.eventID), [snapshot.bookmakerID]);
    await this.redis.xadd(redisKeys.streamOddsTicks(), {
      eventID: tick.eventID,
      oddID: tick.oddID,
      bookmakerID: tick.bookmakerID,
      currentOdds: String(tick.currentOdds),
      line: tick.line === null ? "null" : String(tick.line),
      available: String(tick.available),
      vendorUpdatedAt: tick.vendorUpdatedAt || "",
      observedAt: tick.observedAt,
    });

    return tick;
  }

  async writeEventStatus(status: EventStatusTick): Promise<void> {
    const ttl = ttlForEventStatus({
      startsAt: status.startsAt,
      started: status.started,
      ended: status.ended,
      finalized: status.finalized,
    });

    await this.redis.set(redisKeys.eventStatus(status.eventID), JSON.stringify(status), ttl);
    await this.redis.xadd(redisKeys.streamEventStatusTicks(), {
      eventID: status.eventID,
      startsAt: status.startsAt,
      started: String(status.started),
      ended: String(status.ended),
      finalized: String(status.finalized),
      cancelled: String(status.cancelled),
      live: String(status.live),
      vendorUpdatedAt: status.vendorUpdatedAt || "",
      observedAt: status.observedAt,
    });
  }
}
