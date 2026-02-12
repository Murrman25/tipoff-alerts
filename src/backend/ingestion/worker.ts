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

export interface IngestionWorkerConfig {
  maxRequestsPerMinute: number;
  maxEventIdsPerRequest: number;
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
    private readonly sink?: RedisIngestionSink,
  ) {
    this.budget = new TokenBucket({
      capacity: config.maxRequestsPerMinute,
      refillPerSecond: config.maxRequestsPerMinute / 60,
    });
  }

  async runCycle(events: IngestionEventSummary[]) {
    const polls = planPollRequests(events, this.budget, this.config.maxEventIdsPerRequest);
    for (const poll of polls) {
      const response = await this.vendor.getEvents({
        eventIDs: poll.eventIDs.join(","),
        oddsAvailable: true,
        includeAltLines: false,
      });

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

        const oddsByMarket = event.odds || {};
        for (const [oddID, oddNode] of Object.entries(oddsByMarket)) {
          const byBookmaker = oddNode.byBookmaker || {};

          for (const [bookmakerID, rawQuote] of Object.entries(byBookmaker)) {
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
      }
    }
  }
}
