import { classifyLifecycle } from "@/backend/ingestion/cohorts";
import { planPollRequests } from "@/backend/ingestion/planner";
import { RedisIngestionSink } from "@/backend/ingestion/redisSink";
import { TokenBucket } from "@/backend/ingestion/tokenBucket";
import {
  IngestionEventSummary,
  VendorEventsClient,
  VendorIngestionEvent,
} from "@/backend/ingestion/types";
import { parseVendorBookmakerOdds } from "@/backend/odds/parseAmericanOdds";
import { EventStatusTick, OddsTick } from "@/backend/contracts/ticks";
import { redisKeys } from "@/backend/cache/redisKeys";
import { ttlForEventStatus } from "@/backend/cache/ttlPolicy";
import { VendorMarketBookOdds } from "@/backend/ingestion/types";

const CORE_ODD_IDS = [
  "points-home-game-ml-home",
  "points-away-game-ml-away",
  "points-home-game-sp-home",
  "points-away-game-sp-away",
  "points-all-game-ou-over",
  "points-all-game-ou-under",
] as const;

export interface IngestionWorkerConfig {
  maxRequestsPerMinute: number;
  maxEventIdsPerRequest: number;
  bookmakerIDs?: string[];
  bookmakerIDsLive?: string[];
  bookmakerIDsCold?: string[];
}

export interface TickPublisher {
  publishOddsTick: (payload: OddsTick) => Promise<void>;
  publishEventStatusTick: (payload: EventStatusTick) => Promise<void>;
}

export class IngestionWorker<TEvent extends VendorIngestionEvent = VendorIngestionEvent> {
  private budget: TokenBucket;

  constructor(
    private readonly vendor: VendorEventsClient<TEvent>,
    private readonly publisher: TickPublisher,
    private readonly config: IngestionWorkerConfig,
    private readonly redis?: import("@/backend/cache/redisClient").RedisLikeClient,
    private readonly sink?: RedisIngestionSink,
  ) {
    this.budget = new TokenBucket({
      capacity: config.maxRequestsPerMinute,
      refillPerSecond: config.maxRequestsPerMinute / 60,
    });
  }

  async runCycle(events: IngestionEventSummary[]) {
    const polls = await planPollRequests(
      events,
      this.budget,
      this.config.maxEventIdsPerRequest,
      this.redis,
    );
    for (const poll of polls) {
      const lifecycleBookmakers =
        poll.lifecycle === "live" || poll.lifecycle === "starting_soon"
          ? this.config.bookmakerIDsLive
          : this.config.bookmakerIDsCold;

      const bookmakerIDs =
        lifecycleBookmakers && lifecycleBookmakers.length > 0
          ? lifecycleBookmakers
          : this.config.bookmakerIDs;

      const response = await this.vendor.getEvents({
        eventIDs: poll.eventIDs.join(","),
        oddID: CORE_ODD_IDS.join(","),
        bookmakerID: bookmakerIDs?.length ? bookmakerIDs.join(",") : undefined,
        includeAltLines: false,
      });

      if (this.redis) {
        const nowMs = Date.now();
        for (const [eventID, nextAt] of Object.entries(poll.nextPollAtByEventID)) {
          // Keep schedule key alive at least as long as the hot cache keys.
          const summary = events.find((item) => item.eventID === eventID);
          const ttl = summary
            ? ttlForEventStatus({
                startsAt: summary.startsAt,
                started: summary.started,
                ended: summary.ended,
                finalized: summary.finalized,
              })
            : 10 * 60;

          // Store epoch millis so the planner can compare cheaply.
          await this.redis.set(redisKeys.pollNextAt(eventID), String(Math.max(nowMs, nextAt)), ttl);
        }
      }

      for (const event of response.data) {
        const statusTick: EventStatusTick = {
          type: "EVENT_STATUS_TICK",
          eventID: event.eventID,
          startsAt: event.status?.startsAt || new Date().toISOString(),
          started: Boolean(event.status?.started),
          ended: Boolean(event.status?.ended),
          finalized: Boolean(event.status?.finalized),
          cancelled: Boolean(event.status?.cancelled),
          live: classifyLifecycle({
            eventID: event.eventID,
            leagueID: event.leagueID,
            startsAt: event.status?.startsAt,
            started: Boolean(event.status?.started),
            ended: Boolean(event.status?.ended),
            finalized: Boolean(event.status?.finalized),
          }) === "live",
          vendorUpdatedAt: event.status?.updatedAt || null,
          observedAt: new Date().toISOString(),
        };

        await this.publisher.publishEventStatusTick(statusTick);
        if (this.sink) {
          await this.sink.writeEventStatus(statusTick);
        }

        if (this.redis) {
          const ttl = ttlForEventStatus({
            startsAt: statusTick.startsAt,
            started: statusTick.started,
            ended: statusTick.ended,
            finalized: statusTick.finalized,
          });

          const eventMeta = {
            eventID: event.eventID,
            sportID: event.sportID || "",
            leagueID: event.leagueID,
            teams: event.teams || {},
            status: event.status || {},
            scores: event.scores || null,
            results: event.results || null,
          };

          await this.redis.set(redisKeys.eventMeta(event.eventID), JSON.stringify(eventMeta), ttl);
        }

        const oddsCoreSnapshot: Record<string, { byBookmaker: Record<string, VendorMarketBookOdds> }> =
          {};

        const oddsByMarket = event.odds || {};
        for (const [oddID, oddNode] of Object.entries(oddsByMarket)) {
          const byBookmaker = oddNode.byBookmaker || {};

          for (const [bookmakerID, rawQuote] of Object.entries(byBookmaker)) {
            if (!oddsCoreSnapshot[oddID]) {
              oddsCoreSnapshot[oddID] = { byBookmaker: {} };
            }
            oddsCoreSnapshot[oddID].byBookmaker[bookmakerID] = {
              odds: rawQuote.odds,
              available: rawQuote.available,
              spread: rawQuote.spread,
              overUnder: rawQuote.overUnder,
            };

            if (this.sink) {
              const tick = await this.sink.writeOddsQuote({
                eventID: event.eventID,
                oddID,
                bookmakerID,
                odds: rawQuote.odds,
                spread: rawQuote.spread,
                overUnder: rawQuote.overUnder,
                available: rawQuote.available,
                startsAt: statusTick.startsAt,
                started: statusTick.started,
                ended: statusTick.ended,
                finalized: statusTick.finalized,
                vendorUpdatedAt: statusTick.vendorUpdatedAt,
                observedAt: statusTick.observedAt,
              });

              if (tick) {
                await this.publisher.publishOddsTick(tick);
              }
              continue;
            }

            const parsedQuote = parseVendorBookmakerOdds(rawQuote);
            if (parsedQuote.currentOdds === null) {
              continue;
            }

            await this.publisher.publishOddsTick({
              type: "ODDS_TICK",
              eventID: event.eventID,
              oddID,
              bookmakerID,
              currentOdds: parsedQuote.currentOdds,
              line: parsedQuote.line,
              available: parsedQuote.available,
              vendorUpdatedAt: statusTick.vendorUpdatedAt,
              observedAt: statusTick.observedAt,
            });
          }
        }

        if (this.redis) {
          const ttl = ttlForEventStatus({
            startsAt: statusTick.startsAt,
            started: statusTick.started,
            ended: statusTick.ended,
            finalized: statusTick.finalized,
          });
          await this.redis.set(
            redisKeys.eventOddsCore(event.eventID),
            JSON.stringify(oddsCoreSnapshot),
            ttl,
          );

          const lifecycle = classifyLifecycle({
            eventID: statusTick.eventID,
            leagueID: event.leagueID,
            startsAt: statusTick.startsAt,
            started: statusTick.started,
            ended: statusTick.ended,
            finalized: statusTick.finalized,
          });

          const liveKey = redisKeys.leagueLiveIndex(event.leagueID);
          const upcomingKey = redisKeys.leagueUpcomingIndex(event.leagueID);

          const startsAtMs = new Date(statusTick.startsAt).getTime();
          const score = Number.isFinite(startsAtMs) ? startsAtMs : Date.now();

          // Keep league indexes alive with a fixed TTL; ingestion refreshes frequently.
          const indexTtlSeconds = 12 * 60 * 60;

          if (lifecycle === "live") {
            await this.redis.sadd(liveKey, [event.eventID]);
            await this.redis.zrem(upcomingKey, [event.eventID]);
          } else if (lifecycle === "finalized") {
            await this.redis.srem(liveKey, [event.eventID]);
            await this.redis.zrem(upcomingKey, [event.eventID]);
          } else {
            await this.redis.srem(liveKey, [event.eventID]);
            await this.redis.zadd(upcomingKey, [{ score, member: event.eventID }]);
          }

          await this.redis.expire(liveKey, indexTtlSeconds);
          await this.redis.expire(upcomingKey, indexTtlSeconds);
        }
      }
    }
  }
}
