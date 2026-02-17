import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGamesStream } from "@/hooks/useGamesStream";

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  url: string;
  onerror: (() => void) | null = null;
  private listeners = new Map<string, Array<() => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name: string, cb: () => void) {
    const existing = this.listeners.get(name) ?? [];
    existing.push(cb);
    this.listeners.set(name, existing);
  }

  emit(name: string) {
    const handlers = this.listeners.get(name) ?? [];
    for (const handler of handlers) {
      handler();
    }
  }

  close() {
    // no-op
  }
}

describe("useGamesStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    (globalThis as unknown as { EventSource: typeof EventSource }).EventSource =
      FakeEventSource as unknown as typeof EventSource;
  });

  it("does not reconnect when onDiff identity changes but event IDs are stable", () => {
    const onDiffA = vi.fn();
    const { rerender } = renderHook(
      ({ onDiff }) =>
        useGamesStream({
          eventIDs: ["evt_1", "evt_2"],
          enabled: true,
          onDiff,
        }),
      {
        initialProps: { onDiff: onDiffA },
      },
    );

    expect(FakeEventSource.instances).toHaveLength(1);

    const onDiffB = vi.fn();
    rerender({ onDiff: onDiffB });

    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("reconnects when event IDs change", () => {
    const onDiff = vi.fn();
    const { rerender } = renderHook(
      ({ ids }) =>
        useGamesStream({
          eventIDs: ids,
          enabled: true,
          onDiff,
        }),
      {
        initialProps: { ids: ["evt_1", "evt_2"] },
      },
    );

    expect(FakeEventSource.instances).toHaveLength(1);
    rerender({ ids: ["evt_1", "evt_3"] });
    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("uses latest callback and throttles diff-triggered refetches", () => {
    const onDiffA = vi.fn();
    const { rerender } = renderHook(
      ({ onDiff }) =>
        useGamesStream({
          eventIDs: ["evt_1"],
          enabled: true,
          onDiff,
          minDiffRefetchMs: 4000,
        }),
      {
        initialProps: { onDiff: onDiffA },
      },
    );

    const source = FakeEventSource.instances[0];
    source.emit("odds_diff");
    source.emit("event_status_diff");
    expect(onDiffA).toHaveBeenCalledTimes(1);

    const onDiffB = vi.fn();
    rerender({ onDiff: onDiffB });

    act(() => {
      vi.advanceTimersByTime(4001);
    });

    source.emit("event_status_diff");
    expect(onDiffA).toHaveBeenCalledTimes(1);
    expect(onDiffB).toHaveBeenCalledTimes(1);
  });
});
