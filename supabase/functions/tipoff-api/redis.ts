export interface RedisCacheClient {
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, members: string[]): Promise<void>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, members: string[]): Promise<void>;
  xadd(
    stream: string,
    fields: Record<string, string>,
    options?: {
      maxLenApprox?: number;
    },
  ): Promise<string | null>;
}

interface UpstashResult<T> {
  result?: T;
}

class UpstashRedisClient implements RedisCacheClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async command<T>(
    segments: Array<string | number>,
    options?: {
      timeoutMs?: number;
      retryable?: boolean;
      maxAttempts?: number;
    },
  ): Promise<T | null> {
    const timeoutMs = options?.timeoutMs ?? 8000;
    const retryable = options?.retryable ?? false;
    const maxAttempts = Math.max(1, options?.maxAttempts ?? (retryable ? 3 : 1));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(segments.map((segment) => String(segment))),
          signal: controller.signal,
        });

        if (!response.ok) {
          const retryStatus = response.status === 429 || response.status >= 500;
          if (retryable && retryStatus && attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(1200, 150 * 2 ** (attempt - 1))));
            continue;
          }
          return null;
        }

        const payload = (await response.json().catch(() => ({}))) as UpstashResult<T>;
        return payload.result ?? null;
      } catch {
        if (retryable && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(1200, 150 * 2 ** (attempt - 1))));
          continue;
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return null;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command<string>(['GET', key], { retryable: true });
    return typeof result === 'string' ? result : null;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    const result = await this.command<unknown>(['MGET', ...keys], { retryable: true });
    if (!Array.isArray(result)) return keys.map(() => null);
    return result.map((value) => (typeof value === 'string' ? value : null));
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.command<unknown>(['SMEMBERS', key], { retryable: true });
    if (!Array.isArray(result)) return [];
    return result.map((value) => (typeof value === 'string' ? value : '')).filter((v) => v.length > 0);
  }

  async srem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.command(['SREM', key, ...members]);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const result = await this.command<unknown>(['ZRANGE', key, start, stop], { retryable: true });
    if (!Array.isArray(result)) return [];
    return result.map((value) => (typeof value === 'string' ? value : '')).filter((v) => v.length > 0);
  }

  async zrem(key: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.command(['ZREM', key, ...members]);
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
    await this.command(['SETEX', key, ttl, JSON.stringify(value)]);
  }

  async xadd(
    stream: string,
    fields: Record<string, string>,
    options?: {
      maxLenApprox?: number;
    },
  ): Promise<string | null> {
    const pairs: (string | number)[] = [];
    for (const [key, value] of Object.entries(fields)) {
      pairs.push(key, value);
    }
    const maxLen = options?.maxLenApprox;
    const segments =
      typeof maxLen === 'number' && Number.isFinite(maxLen) && maxLen > 0
        ? ['XADD', stream, 'MAXLEN', '~', Math.floor(maxLen), '*', ...pairs]
        : ['XADD', stream, '*', ...pairs];
    const result = await this.command<string>(segments);
    return typeof result === 'string' ? result : null;
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
