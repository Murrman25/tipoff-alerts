export interface RedisLikeClient {
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  sadd(key: string, members: string[]): Promise<void>;
  smembers(key: string): Promise<string[]>;
  xadd(stream: string, fields: Record<string, string>): Promise<void>;
}

interface StoredValue {
  value: string;
  expiresAt: number | null;
}

export class InMemoryRedisClient implements RedisLikeClient {
  private kv = new Map<string, StoredValue>();
  private sets = new Map<string, Set<string>>();
  private streams = new Map<string, Array<Record<string, string>>>();

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      typeof ttlSeconds === "number" && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1000
        : null;
    this.kv.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const existing = this.kv.get(key);
    if (!existing) {
      return null;
    }

    if (existing.expiresAt !== null && existing.expiresAt <= Date.now()) {
      this.kv.delete(key);
      return null;
    }

    return existing.value;
  }

  async sadd(key: string, members: string[]): Promise<void> {
    const set = this.sets.get(key) ?? new Set<string>();
    for (const member of members) {
      set.add(member);
    }
    this.sets.set(key, set);
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async xadd(stream: string, fields: Record<string, string>): Promise<void> {
    const existing = this.streams.get(stream) ?? [];
    existing.push(fields);
    this.streams.set(stream, existing);
  }

  getStreamEntries(stream: string): Array<Record<string, string>> {
    return this.streams.get(stream) ?? [];
  }
}
