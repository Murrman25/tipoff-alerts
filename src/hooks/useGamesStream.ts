import { useEffect, useMemo, useRef, useState } from "react";

import { TIPOFF_API_BASE_URL } from "@/lib/tipoffApi";

interface UseGamesStreamOptions {
  eventIDs: string[];
  enabled?: boolean;
  onDiff?: () => void;
}

export function useGamesStream(options: UseGamesStreamOptions) {
  const enabled = options.enabled ?? true;
  const onDiff = options.onDiff;
  const [isConnected, setIsConnected] = useState(false);
  const diffCooldownRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);

  const eventIDsParam = useMemo(
    () => options.eventIDs.filter(Boolean).slice(0, 20).join(","),
    [options.eventIDs],
  );

  useEffect(() => {
    if (!enabled || !eventIDsParam || typeof window === "undefined" || !("EventSource" in window)) {
      return;
    }

    const url = `${TIPOFF_API_BASE_URL}/stream?eventIDs=${encodeURIComponent(eventIDsParam)}&channels=odds,status`;
    let source: EventSource | null = null;
    let cancelled = false;

    const triggerDiff = () => {
      if (!onDiff) return;
      if (diffCooldownRef.current !== null) return;

      diffCooldownRef.current = window.setTimeout(() => {
        diffCooldownRef.current = null;
      }, 4000);
      onDiff();
    };

    const connect = () => {
      if (cancelled) {
        return;
      }

      source = new EventSource(url);

      source.addEventListener("ready", () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
      });
      source.addEventListener("heartbeat", () => setIsConnected(true));
      source.addEventListener("odds_diff", triggerDiff);
      source.addEventListener("event_status_diff", triggerDiff);
      source.onerror = () => {
        setIsConnected(false);
        source?.close();
        source = null;

        if (cancelled) {
          return;
        }

        reconnectAttemptRef.current += 1;
        const exponentialDelay = Math.min(30000, 1000 * 2 ** Math.max(0, reconnectAttemptRef.current - 1));
        const jitter = Math.floor(Math.random() * 500);
        reconnectTimerRef.current = window.setTimeout(connect, exponentialDelay + jitter);
      };
    };

    connect();

    return () => {
      cancelled = true;
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
  }, [enabled, eventIDsParam, onDiff]);

  return { isConnected };
}
