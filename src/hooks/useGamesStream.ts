import { useEffect, useMemo, useRef, useState } from "react";

import { TIPOFF_API_BASE_URL } from "@/lib/tipoffApi";

interface UseGamesStreamOptions {
  eventIDs: string[];
  enabled?: boolean;
  onDiff?: () => void;
  minDiffRefetchMs?: number;
}

export function useGamesStream(options: UseGamesStreamOptions) {
  const enabled = options.enabled ?? true;
  const minDiffRefetchMs = options.minDiffRefetchMs ?? 4000;
  const [isConnected, setIsConnected] = useState(false);
  const onDiffRef = useRef<(() => void) | undefined>(options.onDiff);
  const diffCooldownRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionallyClosedRef = useRef(false);

  const eventIDsParam = useMemo(
    () => Array.from(new Set(options.eventIDs.filter(Boolean))).sort().slice(0, 20).join(","),
    [options.eventIDs],
  );

  useEffect(() => {
    onDiffRef.current = options.onDiff;
  }, [options.onDiff]);

  useEffect(() => {
    if (!enabled || !eventIDsParam || typeof window === "undefined" || !("EventSource" in window)) {
      return;
    }

    intentionallyClosedRef.current = false;
    const url = `${TIPOFF_API_BASE_URL}/stream?eventIDs=${encodeURIComponent(eventIDsParam)}&channels=odds,status`;
    let source: EventSource | null = null;
    let cancelled = false;

    if (import.meta.env.DEV) {
      console.debug("[games-stream] connect", { eventIDs: eventIDsParam.split(",").length, url });
    }

    const triggerDiff = () => {
      if (!onDiffRef.current) return;
      if (diffCooldownRef.current !== null) return;

      diffCooldownRef.current = window.setTimeout(() => {
        diffCooldownRef.current = null;
      }, Math.max(250, minDiffRefetchMs));
      onDiffRef.current();
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      source = new EventSource(url);

      source.addEventListener("ready", () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
        if (import.meta.env.DEV) {
          console.debug("[games-stream] ready");
        }
      });
      source.addEventListener("heartbeat", () => setIsConnected(true));
      source.addEventListener("odds_diff", triggerDiff);
      source.addEventListener("event_status_diff", triggerDiff);
      source.onerror = () => {
        if (cancelled || intentionallyClosedRef.current) {
          return;
        }
        setIsConnected(false);
        source?.close();
        source = null;

        reconnectAttemptRef.current += 1;
        const exponentialDelay = Math.min(30000, 1000 * 2 ** Math.max(0, reconnectAttemptRef.current - 1));
        const jitter = Math.floor(Math.random() * 500);
        if (import.meta.env.DEV) {
          console.debug("[games-stream] reconnect", {
            attempt: reconnectAttemptRef.current,
            delayMs: exponentialDelay + jitter,
          });
        }
        reconnectTimerRef.current = window.setTimeout(connect, exponentialDelay + jitter);
      };
    };

    connect();

    return () => {
      cancelled = true;
      intentionallyClosedRef.current = true;
      if (import.meta.env.DEV) {
        console.debug("[games-stream] cleanup");
      }
      source?.close();
      source = null;
      setIsConnected(false);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      reconnectAttemptRef.current = 0;
      if (diffCooldownRef.current !== null) {
        window.clearTimeout(diffCooldownRef.current);
        diffCooldownRef.current = null;
      }
    };
  }, [enabled, eventIDsParam, minDiffRefetchMs]);

  return { isConnected };
}
