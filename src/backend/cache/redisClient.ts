export interface RedisLikeClient {
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  setWithGet(key: string, value: string, ttlSeconds: number): Promise<string | null>;
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  expire(key: string, ttlSeconds: number): Promise<void>;
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

  async setWithGet(key: string, value: string, ttlSeconds: number): Promise<string | null> {
    const previous = await this.get(key);
    await this.set(key, value, ttlSeconds);
    return previous;
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

  async mget(keys: string[]): Promise<(string | null)[]> {
    const results: (string | null)[] = [];
    for (const key of keys) {
      results.push(await this.get(key));
    }
    return results;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const existing = this.kv.get(key);
    if (existing) {
      const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
      this.kv.set(key, { value: existing.value, expiresAt });
    }

    if (this.sets.has(key)) {
      // Model set expiration by storing an empty tombstone key.
      const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
      this.kv.set(`__set_ttl__:${key}`, { value: "1", expiresAt });
    }
  }

  async sadd(key: string, members: string[]): Promise<void> {
    const set = this.sets.get(key) ?? new Set<string>();
    for (const member of members) {
      set.add(member);
    }
    this.sets.set(key, set);
  }

  async smembers(key: string): Promise<string[]> {
    const ttlMarker = this.kv.get(`__set_ttl__:${key}`);
    if (ttlMarker?.expiresAt !== null && ttlMarker.expiresAt <= Date.now()) {
      this.kv.delete(`__set_ttl__:${key}`);
      this.sets.delete(key);
      return [];
    }
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
