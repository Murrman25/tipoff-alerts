export interface RedisCacheClient {
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  smembers(key: string): Promise<string[]>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
}

interface UpstashResult<T> {
  result?: T;
}

class UpstashRedisClient implements RedisCacheClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async command<T>(...segments: (string | number)[]): Promise<T | null> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(segments.map((segment) => String(segment))),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => ({}))) as UpstashResult<T>;
    return payload.result ?? null;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command<string>('GET', key);
    return typeof result === 'string' ? result : null;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    const result = await this.command<unknown>('MGET', ...keys);
    if (!Array.isArray(result)) return keys.map(() => null);
    return result.map((value) => (typeof value === 'string' ? value : null));
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.command<unknown>('SMEMBERS', key);
    if (!Array.isArray(result)) return [];
    return result.map((value) => (typeof value === 'string' ? value : '')).filter((v) => v.length > 0);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const result = await this.command<unknown>('ZRANGE', key, start, stop);
    if (!Array.isArray(result)) return [];
    return result.map((value) => (typeof value === 'string' ? value : '')).filter((v) => v.length > 0);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const serialized = await this.get(key);
    if (!serialized) {
      return null;
    }

    try {
      return JSON.parse(serialized) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    await this.command('SETEX', key, ttl, JSON.stringify(value));
  }
}

export function createRedisClientFromEnv(): RedisCacheClient | null {
  const baseUrl = Deno.env.get('REDIS_REST_URL');
  const token = Deno.env.get('REDIS_REST_TOKEN');

  if (!baseUrl || !token) {
    return null;
  }

  return new UpstashRedisClient(baseUrl, token);
}
