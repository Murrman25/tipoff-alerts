import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { CORE_ODD_IDS } from './types.ts';
import { enrichTeams, mapEventPayload } from './games.ts';
import { fetchVendorEvents } from './vendor.ts';
import { recordMetric } from './metrics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sseHeaders = {
  ...corsHeaders,
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

export function encodeSseEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function streamEvents(
  url: URL,
  apiKey: string,
  serviceClient: ReturnType<typeof createClient>,
): Response {
  const eventIDsParam = url.searchParams.get('eventIDs');
  if (!eventIDsParam) {
    throw new Error('eventIDs query param is required');
  }

  const eventIDs = eventIDsParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (eventIDs.length === 0) {
    throw new Error('eventIDs query param is empty');
  }

  const encoder = new TextEncoder();
  const previousByEvent = new Map<string, { odds: string; status: string }>();

  const stream = new ReadableStream({
    start(controller) {
      recordMetric('tipoff.stream.connected_clients', 1, { action: 'open' });
      let closed = false;

      const send = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSseEvent(event, payload)));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        recordMetric('tipoff.stream.connected_clients', -1, { action: 'close' });
        clearInterval(timer);
        controller.close();
      };

      const poll = async () => {
        try {
          const response = await fetchVendorEvents(apiKey, {
            eventIDs: eventIDs.join(','),
            oddID: CORE_ODD_IDS.join(','),
            includeAltLines: false,
            limit: eventIDs.length,
          });

          const mapped = response.data.map(mapEventPayload);
          const enriched = await enrichTeams(mapped, serviceClient);
          const asOf = new Date().toISOString();

          for (const event of enriched) {
            const eventID = event.eventID;
            const current = {
              odds: JSON.stringify(event.odds || {}),
              status: JSON.stringify(event.status || {}),
            };
            const previous = previousByEvent.get(eventID);

            if (!previous || previous.status !== current.status) {
              recordMetric('tipoff.stream.diff_events_per_minute', 1, { channel: 'event_status_diff' });
              send('event_status_diff', {
                asOf,
                eventID,
                status: event.status,
                score: event.score || null,
              });
            }

            if (!previous || previous.odds !== current.odds) {
              recordMetric('tipoff.stream.diff_events_per_minute', 1, { channel: 'odds_diff' });
              send('odds_diff', {
                asOf,
                eventID,
                odds: event.odds,
              });
            }

            previousByEvent.set(eventID, current);
          }

          send('heartbeat', {
            asOf,
            watchedEvents: eventIDs.length,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Stream polling failed';
          send('error', { message });
        }
      };

      send('ready', {
        asOf: new Date().toISOString(),
        watchedEvents: eventIDs.length,
      });

      poll();
      const timer = setInterval(poll, 25000);

      setTimeout(close, 10 * 60 * 1000);
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
