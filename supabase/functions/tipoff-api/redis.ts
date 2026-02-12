export interface RedisCacheClient {
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
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
    const encoded = segments.map((segment) => encodeURIComponent(String(segment))).join('/');
    const url = `${this.baseUrl}/${encoded}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => ({}))) as UpstashResult<T>;
    return payload.result ?? null;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const serialized = await this.command<string>('GET', key);
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
