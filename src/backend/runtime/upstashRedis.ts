import { RedisLikeClient } from "@/backend/cache/redisClient";

interface UpstashEnvelope<T> {
  result?: T;
}

interface StreamEntry {
  id: string;
  fields: Record<string, string>;
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

export class UpstashRedisClient implements RedisLikeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async command<T>(...segments: (string | number)[]): Promise<T | null> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(segments.map((segment) => String(segment))),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Upstash command failed (${response.status}): ${body}`);
    }

    const payload = (await response.json().catch(() => ({}))) as UpstashEnvelope<T>;
    return payload.result ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
      await this.command("SETEX", key, Math.floor(ttlSeconds), value);
      return;
    }

    await this.command("SET", key, value);
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command<string>("GET", key);
    return typeof result === "string" ? result : null;
  }

  async sadd(key: string, members: string[]): Promise<void> {
    if (members.length === 0) {
      return;
    }
    await this.command("SADD", key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.command<unknown>("SMEMBERS", key);
    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => value !== null);
  }

  async xadd(stream: string, fields: Record<string, string>): Promise<void> {
    const pairs = Object.entries(fields).flatMap(([key, value]) => [key, value]);
    await this.command("XADD", stream, "*", ...pairs);
  }

  async xgroupCreate(stream: string, group: string): Promise<void> {
    try {
      await this.command("XGROUP", "CREATE", stream, group, "$", "MKSTREAM");
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
  }): Promise<StreamEntry[]> {
    const count = params.count ?? 50;
    const blockMs = params.blockMs ?? 5000;

    const raw = await this.command<unknown>(
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
      ">",
    );

    return parseStreamEntries(raw);
  }

  async xack(stream: string, group: string, id: string): Promise<void> {
    await this.command("XACK", stream, group, id);
  }

  async ping(): Promise<number | null> {
    const start = Date.now();
    const result = await this.command<string>("PING");
    if (result !== "PONG") {
      return null;
    }

    return Math.max(0, Date.now() - start);
  }

  async xlen(stream: string): Promise<number | null> {
    const result = await this.command<number | string>("XLEN", stream);
    if (typeof result === "number" && Number.isFinite(result)) {
      return result;
    }

    if (typeof result === "string") {
      const parsed = Number.parseInt(result, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
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
