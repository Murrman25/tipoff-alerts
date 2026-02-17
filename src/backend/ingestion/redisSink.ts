import { RedisLikeClient } from "@/backend/cache/redisClient";
import { redisKeys } from "@/backend/cache/redisKeys";
import { ttlForEventStatus, ttlForOddsQuote } from "@/backend/cache/ttlPolicy";
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

export interface RedisIngestionSinkOptions {
  oddsStreamMaxLen?: number;
  statusStreamMaxLen?: number;
}

export class RedisIngestionSink {
  constructor(
    private readonly redis: RedisLikeClient,
    private readonly options: RedisIngestionSinkOptions = {},
  ) {}

  private stableOddsFields(serialized: string | null): {
    currentOdds: number | null;
    line: number | null;
    available: boolean;
  } | null {
    if (!serialized) return null;
    try {
      const parsed = JSON.parse(serialized) as Partial<OddsTick>;
      if (typeof parsed !== "object" || parsed === null) return null;
      return {
        currentOdds: typeof parsed.currentOdds === "number" ? parsed.currentOdds : null,
        line: typeof parsed.line === "number" ? parsed.line : null,
        available: Boolean(parsed.available),
      };
    } catch {
      return null;
    }
  }

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
    const ttl = ttlForOddsQuote({
      startsAt: snapshot.startsAt,
      started: snapshot.started,
      ended: snapshot.ended,
      finalized: snapshot.finalized,
    });

    const previousRaw = await this.redis.setWithGet(
      quoteKey,
      JSON.stringify({
        ...tick,
        source: "ingestion-worker",
      }),
      ttl,
    );

    const previous = this.stableOddsFields(previousRaw);
    const changed =
      !previous ||
      previous.currentOdds !== tick.currentOdds ||
      previous.line !== tick.line ||
      previous.available !== tick.available;

    const booksKey = redisKeys.eventBooks(snapshot.eventID);
    await this.redis.sadd(booksKey, [snapshot.bookmakerID]);
    await this.redis.expire(booksKey, ttl);

    if (changed) {
      await this.redis.xadd(redisKeys.streamOddsTicks(), {
        eventID: tick.eventID,
        oddID: tick.oddID,
        bookmakerID: tick.bookmakerID,
        currentOdds: String(tick.currentOdds),
        line: tick.line === null ? "null" : String(tick.line),
        available: String(tick.available),
        vendorUpdatedAt: tick.vendorUpdatedAt || "",
        observedAt: tick.observedAt,
      }, {
        maxLenApprox: this.options.oddsStreamMaxLen,
      });
    }

    return tick;
  }

  private stableStatusFields(serialized: string | null): {
    leagueID: string;
    sportID: string;
    startsAt: string;
    started: boolean;
    ended: boolean;
    finalized: boolean;
    cancelled: boolean;
    live: boolean;
    scoreHome: number | null;
    scoreAway: number | null;
    period: string;
    clock: string;
  } | null {
    if (!serialized) return null;
    try {
      const parsed = JSON.parse(serialized) as Partial<EventStatusTick>;
      if (typeof parsed !== "object" || parsed === null) return null;
      return {
        leagueID: typeof parsed.leagueID === "string" ? parsed.leagueID : "",
        sportID: typeof parsed.sportID === "string" ? parsed.sportID : "",
        startsAt: typeof parsed.startsAt === "string" ? parsed.startsAt : "",
        started: Boolean(parsed.started),
        ended: Boolean(parsed.ended),
        finalized: Boolean(parsed.finalized),
        cancelled: Boolean(parsed.cancelled),
        live: Boolean(parsed.live),
        scoreHome: typeof parsed.scoreHome === "number" ? parsed.scoreHome : null,
        scoreAway: typeof parsed.scoreAway === "number" ? parsed.scoreAway : null,
        period: typeof parsed.period === "string" ? parsed.period : "",
        clock: typeof parsed.clock === "string" ? parsed.clock : "",
      };
    } catch {
      return null;
    }
  }

  async writeEventStatus(status: EventStatusTick): Promise<void> {
    const ttl = ttlForEventStatus({
      startsAt: status.startsAt,
      started: status.started,
      ended: status.ended,
      finalized: status.finalized,
    });

    const statusKey = redisKeys.eventStatus(status.eventID);
    const previousRaw = await this.redis.setWithGet(statusKey, JSON.stringify(status), ttl);
    const previous = this.stableStatusFields(previousRaw);
    const changed =
      !previous ||
      previous.leagueID !== (status.leagueID || "") ||
      previous.sportID !== (status.sportID || "") ||
      previous.startsAt !== status.startsAt ||
      previous.started !== status.started ||
      previous.ended !== status.ended ||
      previous.finalized !== status.finalized ||
      previous.cancelled !== status.cancelled ||
      previous.live !== status.live ||
      previous.scoreHome !== (typeof status.scoreHome === "number" ? status.scoreHome : null) ||
      previous.scoreAway !== (typeof status.scoreAway === "number" ? status.scoreAway : null) ||
      previous.period !== (status.period || "") ||
      previous.clock !== (status.clock || "");

    if (changed) {
      await this.redis.xadd(redisKeys.streamEventStatusTicks(), {
        eventID: status.eventID,
        leagueID: status.leagueID || "",
        sportID: status.sportID || "",
        startsAt: status.startsAt,
        started: String(status.started),
        ended: String(status.ended),
        finalized: String(status.finalized),
        cancelled: String(status.cancelled),
        live: String(status.live),
        scoreHome: status.scoreHome === null || status.scoreHome === undefined ? "null" : String(status.scoreHome),
        scoreAway: status.scoreAway === null || status.scoreAway === undefined ? "null" : String(status.scoreAway),
        period: status.period || "",
        clock: status.clock || "",
        updatedAt: status.updatedAt || "",
        vendorUpdatedAt: status.vendorUpdatedAt || "",
        observedAt: status.observedAt,
      }, {
        maxLenApprox: this.options.statusStreamMaxLen,
      });
    }
  }
}
