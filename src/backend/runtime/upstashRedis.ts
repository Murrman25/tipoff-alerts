import { RedisLikeClient } from "@/backend/cache/redisClient";

interface UpstashEnvelope<T> {
  result?: T;
}

export interface StreamEntry {
  id: string;
  fields: Record<string, string>;
}

export interface XPendingSummary {
  pending: number;
  minId: string | null;
  maxId: string | null;
  consumers: Array<{ name: string; pending: number }>;
}

export interface XPendingEntry {
  id: string;
  consumer: string;
  idleMs: number;
  deliveries: number;
}

export interface XAutoClaimResult {
  nextStartId: string;
  entries: StreamEntry[];
}

export interface XInfoGroup {
  name: string;
  consumers: number;
  pending: number;
  lag: number | null;
}

interface CommandOptions {
  timeoutMs?: number;
  retryable?: boolean;
  maxAttempts?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFieldMap(rawFields: unknown): Record<string, string> {
  if (!Array.isArray(rawFields)) {
    return {};
  }

  const mapped: Record<string, string> = {};
  for (let i = 0; i < rawFields.length; i += 2) {
    const key = rawFields[i];
    const value = rawFields[i + 1];
    if (typeof key === "string") {
      mapped[key] = typeof value === "string" ? value : String(value ?? "");
    }
  }
  return mapped;
}

function parseStreamEntries(rawResult: unknown): StreamEntry[] {
  if (!Array.isArray(rawResult) || rawResult.length === 0) {
    return [];
  }

  const entries: StreamEntry[] = [];
  for (const streamNode of rawResult) {
    if (!Array.isArray(streamNode) || streamNode.length < 2) {
      continue;
    }

    const messages = streamNode[1];
    if (!Array.isArray(messages)) {
      continue;
    }

    for (const messageNode of messages) {
      if (!Array.isArray(messageNode) || messageNode.length < 2) {
        continue;
      }

      const id = messageNode[0];
      const fields = messageNode[1];
      if (typeof id !== "string") {
        continue;
      }

      entries.push({ id, fields: toFieldMap(fields) });
    }
  }

  return entries;
}

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseXPendingSummary(raw: unknown): XPendingSummary | null {
  if (!Array.isArray(raw) || raw.length < 4) return null;

  const pending = asInt(raw[0]);
  const minId = typeof raw[1] === "string" ? raw[1] : null;
  const maxId = typeof raw[2] === "string" ? raw[2] : null;
  const consumersRaw = raw[3];

  if (pending === null || !Array.isArray(consumersRaw)) return null;

  const consumers: Array<{ name: string; pending: number }> = [];
  for (const node of consumersRaw) {
    if (!Array.isArray(node) || node.length < 2 || typeof node[0] !== "string") continue;
    const count = asInt(node[1]);
    if (count === null) continue;
    consumers.push({ name: node[0], pending: count });
  }

  return { pending, minId, maxId, consumers };
}

function parseXPendingEntries(raw: unknown): XPendingEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: XPendingEntry[] = [];
  for (const node of raw) {
    if (!Array.isArray(node) || node.length < 4 || typeof node[0] !== "string") continue;
    const consumer = typeof node[1] === "string" ? node[1] : "";
    const idleMs = asInt(node[2]);
    const deliveries = asInt(node[3]);
    if (!consumer || idleMs === null || deliveries === null) continue;
    entries.push({ id: node[0], consumer, idleMs, deliveries });
  }
  return entries;
}

function parseXAutoClaimResult(raw: unknown, startId: string): XAutoClaimResult {
  if (!Array.isArray(raw) || raw.length < 2) {
    return { nextStartId: startId, entries: [] };
  }

  const nextStartId = typeof raw[0] === "string" ? raw[0] : startId;
  const entries = Array.isArray(raw[1])
    ? raw[1]
        .map((node) => {
          if (!Array.isArray(node) || node.length < 2 || typeof node[0] !== "string") {
            return null;
          }
          return {
            id: node[0],
            fields: toFieldMap(node[1]),
          } satisfies StreamEntry;
        })
        .filter((entry): entry is StreamEntry => entry !== null)
    : [];

  return { nextStartId, entries };
}

function parseXInfoGroups(raw: unknown): XInfoGroup[] {
  if (!Array.isArray(raw)) return [];
  const groups: XInfoGroup[] = [];
  for (const node of raw) {
    if (!Array.isArray(node)) continue;
    const record = new Map<string, unknown>();
    for (let i = 0; i < node.length; i += 2) {
      const key = node[i];
      const value = node[i + 1];
      if (typeof key === "string") {
        record.set(key, value);
      }
    }

    const name = record.get("name");
    if (typeof name !== "string" || name.length === 0) continue;

    groups.push({
      name,
      consumers: asInt(record.get("consumers")) ?? 0,
      pending: asInt(record.get("pending")) ?? 0,
      lag: asInt(record.get("lag")),
    });
  }
  return groups;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

export class UpstashRedisClient implements RedisLikeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async command<T>(
    segments: Array<string | number>,
    options?: CommandOptions,
  ): Promise<T | null> {
    const timeoutMs = options?.timeoutMs ?? 8000;
    const retryable = options?.retryable ?? false;
    const maxAttempts = Math.max(1, options?.maxAttempts ?? (retryable ? 3 : 1));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(segments.map((segment) => String(segment))),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          const shouldRetry = retryable && (response.status === 429 || response.status >= 500);
          if (shouldRetry && attempt < maxAttempts) {
            await delay(Math.min(1200, 150 * 2 ** (attempt - 1)));
            continue;
          }
          throw new Error(`UPSTASH_NON_RETRYABLE:${response.status}:${body}`);
        }

        const payload = (await response.json().catch(() => ({}))) as UpstashEnvelope<T>;
        return payload.result ?? null;
      } catch (error) {
        const isAbort = error instanceof DOMException && error.name === "AbortError";
        const nonRetryable =
          error instanceof Error && error.message.startsWith("UPSTASH_NON_RETRYABLE:");
        if (retryable && !nonRetryable && attempt < maxAttempts) {
          await delay(Math.min(1200, 150 * 2 ** (attempt - 1)));
          continue;
        }
        const message = error instanceof Error ? error.message : String(error ?? "");
        if (nonRetryable && error instanceof Error) {
          const parts = error.message.split(":");
          const status = parts[1] || "unknown";
          const body = parts.slice(2).join(":");
          throw new Error(`Upstash command failed (${status}): ${body}`);
        }
        if (isAbort) {
          throw new Error(`Upstash command timed out after ${timeoutMs}ms`);
        }
        throw new Error(`Upstash command failed: ${message}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
      await this.command(["SETEX", key, Math.floor(ttlSeconds), value]);
      return;
    }

    await this.command(["SET", key, value]);
  }

  async setWithGet(key: string, value: string, ttlSeconds: number): Promise<string | null> {
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    const previous = await this.command<string | null>(["SET", key, value, "EX", ttl, "GET"]);
    return typeof previous === "string" ? previous : null;
  }

  async setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    const result = await this.command<string | null>(["SET", key, value, "NX", "EX", ttl]);
    return result === "OK";
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command<string>(["GET", key], { retryable: true });
    return typeof result === "string" ? result : null;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) {
      return [];
    }
    const result = await this.command<unknown>(["MGET", ...keys], { retryable: true });
    if (!Array.isArray(result)) {
      return keys.map(() => null);
    }
    return result.map((value) => (typeof value === "string" ? value : null));
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    await this.command(["EXPIRE", key, ttl]);
  }

  async sadd(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.command(["SADD", key, ...members]);
  }

  async srem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.command(["SREM", key, ...members]);
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.command<unknown>(["SMEMBERS", key], { retryable: true });
    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => value !== null);
  }

  async zadd(key: string, entries: Array<{ score: number; member: string }>): Promise<void> {
    if (entries.length === 0) return;
    const args: (string | number)[] = [];
    for (const entry of entries) {
      if (!Number.isFinite(entry.score) || !entry.member) continue;
      args.push(entry.score, entry.member);
    }
    if (args.length === 0) return;
    await this.command(["ZADD", key, ...args]);
  }

  async zrem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.command(["ZREM", key, ...members]);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const result = await this.command<unknown>(["ZRANGE", key, start, stop], { retryable: true });
    if (!Array.isArray(result)) return [];
    return result
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => value !== null);
  }

  async xadd(
    stream: string,
    fields: Record<string, string>,
    options?: { maxLenApprox?: number },
  ): Promise<void> {
    const pairs = Object.entries(fields).flatMap(([key, value]) => [key, value]);
    const maxLen = options?.maxLenApprox;
    if (typeof maxLen === "number" && Number.isFinite(maxLen) && maxLen > 0) {
      await this.command(["XADD", stream, "MAXLEN", "~", Math.floor(maxLen), "*", ...pairs]);
      return;
    }
    await this.command(["XADD", stream, "*", ...pairs]);
  }

  async xtrim(stream: string, maxLen: number, approximate = true): Promise<number | null> {
    const bounded = Math.max(1, Math.floor(maxLen));
    const args: Array<string | number> = ["XTRIM", stream, "MAXLEN"];
    if (approximate) {
      args.push("~");
    }
    args.push(bounded);
    const result = await this.command<number | string>(args);
    return asInt(result);
  }

  async xgroupCreate(stream: string, group: string): Promise<void> {
    try {
      await this.command(["XGROUP", "CREATE", stream, group, "$", "MKSTREAM"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("BUSYGROUP")) {
        return;
      }
      throw error;
    }
  }

  async xreadgroup(params: {
    stream: string;
    group: string;
    consumer: string;
    count?: number;
    blockMs?: number;
    readId?: string;
  }): Promise<StreamEntry[]> {
    const count = params.count ?? 50;
    const blockMs = params.blockMs ?? 5000;
    const readId = params.readId ?? ">";

    const raw = await this.command<unknown>([
      "XREADGROUP",
      "GROUP",
      params.group,
      params.consumer,
      "COUNT",
      count,
      "BLOCK",
      blockMs,
      "STREAMS",
      params.stream,
      readId,
    ]);

    return parseStreamEntries(raw);
  }

  async xautoclaim(params: {
    stream: string;
    group: string;
    consumer: string;
    minIdleMs: number;
    startId?: string;
    count?: number;
  }): Promise<XAutoClaimResult> {
    const startId = params.startId ?? "0-0";
    const count = Math.max(1, params.count ?? 50);
    const raw = await this.command<unknown>([
      "XAUTOCLAIM",
      params.stream,
      params.group,
      params.consumer,
      Math.max(1, Math.floor(params.minIdleMs)),
      startId,
      "COUNT",
      count,
    ]);
    return parseXAutoClaimResult(raw, startId);
  }

  async xpendingSummary(stream: string, group: string): Promise<XPendingSummary | null> {
    const raw = await this.command<unknown>(["XPENDING", stream, group], { retryable: true });
    return parseXPendingSummary(raw);
  }

  async xpending(params: {
    stream: string;
    group: string;
    start?: string;
    end?: string;
    count?: number;
    consumer?: string;
  }): Promise<XPendingEntry[]> {
    const start = params.start ?? "-";
    const end = params.end ?? "+";
    const count = Math.max(1, params.count ?? 50);
    const args: Array<string | number> = ["XPENDING", params.stream, params.group, start, end, count];
    if (params.consumer) {
      args.push(params.consumer);
    }
    const raw = await this.command<unknown>(args, { retryable: true });
    return parseXPendingEntries(raw);
  }

  async xinfoGroups(stream: string): Promise<XInfoGroup[]> {
    const raw = await this.command<unknown>(["XINFO", "GROUPS", stream], { retryable: true });
    return parseXInfoGroups(raw);
  }

  async xack(stream: string, group: string, id: string): Promise<void> {
    await this.command(["XACK", stream, group, id]);
  }

  async ping(): Promise<number | null> {
    const start = Date.now();
    const result = await this.command<string>(["PING"], { retryable: true });
    if (result !== "PONG") {
      return null;
    }

    return Math.max(0, Date.now() - start);
  }

  async xlen(stream: string): Promise<number | null> {
    const result = await this.command<number | string>(["XLEN", stream], { retryable: true });
    return asInt(result);
  }
}

export function createUpstashRedisFromEnv(): UpstashRedisClient {
  const baseUrl = process.env.REDIS_REST_URL;
  const token = process.env.REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("REDIS_REST_URL and REDIS_REST_TOKEN are required");
  }

  return new UpstashRedisClient(baseUrl, token);
}

export function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed) && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return parsed as T;
  } catch {
    return null;
  }
}
