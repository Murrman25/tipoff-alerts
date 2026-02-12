import { VendorEventsResponse } from './types.ts';
import { recordMetric } from './metrics.ts';

const VENDOR_BASE_URL = 'https://api.sportsgameodds.com/v2/events';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;

export class VendorRequestError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'VendorRequestError';
    this.status = status;
    this.retryable = status === 429 || status >= 500;
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(args: Record<string, string | number | boolean | undefined>) {
  const url = new URL(VENDOR_BASE_URL);
  Object.entries(args).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url;
}

function asVendorResponse(payload: unknown): VendorEventsResponse {
  if (!payload || typeof payload !== 'object') {
    return { data: [] };
  }

  const maybe = payload as { data?: unknown; nextCursor?: unknown };
  return {
    data: Array.isArray(maybe.data) ? (maybe.data as VendorEventsResponse['data']) : [],
    nextCursor: typeof maybe.nextCursor === 'string' ? maybe.nextCursor : undefined,
  };
}

export async function fetchVendorEvents(
  apiKey: string,
  args: Record<string, string | number | boolean | undefined>,
): Promise<VendorEventsResponse> {
  const url = buildUrl(args);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.text();
        recordMetric('tipoff.vendor.request.count', 1, {
          status: String(response.status),
        });
        recordMetric('tipoff.vendor.request.latency_ms', Date.now() - start, {
          status: String(response.status),
        });
        throw new VendorRequestError(
          `SportsGameOdds request failed (${response.status}): ${body}`,
          response.status,
        );
      }

      const payload = await response.json();
      recordMetric('tipoff.vendor.request.count', 1, { status: String(response.status) });
      recordMetric('tipoff.vendor.request.latency_ms', Date.now() - start, {
        status: String(response.status),
      });
      return asVendorResponse(payload);
    } catch (error) {
      clearTimeout(timeoutId);
      recordMetric('tipoff.vendor.request.error.count', 1, { attempt: String(attempt) });

      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const timeoutError = isAbort
        ? new VendorRequestError('SportsGameOdds request timed out', 504)
        : null;
      const handledError = timeoutError || error;

      if (handledError instanceof VendorRequestError && handledError.retryable && attempt < MAX_ATTEMPTS) {
        const backoffMs = Math.min(5000, 250 * 2 ** (attempt - 1));
        const jitterMs = Math.floor(Math.random() * 125);
        await delay(backoffMs + jitterMs);
        continue;
      }

      throw handledError;
    }
  }

  throw new VendorRequestError('SportsGameOdds request failed after retries', 503);
}
