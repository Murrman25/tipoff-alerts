interface VendorUsage {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  utilizationPct: number | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNumericValue(
  records: Array<Record<string, unknown> | null>,
  keys: string[],
): number | null {
  for (const record of records) {
    if (!record) {
      continue;
    }

    for (const key of keys) {
      const parsed = asNumber(record[key]);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

function parseRateLimitWindow(window: Record<string, unknown> | null): {
  used: number | null;
  limit: number | null;
  remaining: number | null;
} {
  if (!window) {
    return { used: null, limit: null, remaining: null };
  }

  const used = pickNumericValue([window], [
    "current-requests",
    "currentRequests",
    "current_requests",
    "used",
    "requestsUsed",
  ]);
  const limit = pickNumericValue([window], [
    "max-requests",
    "maxRequests",
    "max_requests",
    "limit",
    "requestsLimit",
  ]);
  const remainingRaw = pickNumericValue([window], ["remaining", "requestsRemaining"]);
  const remaining =
    remainingRaw !== null
      ? remainingRaw
      : used !== null && limit !== null
        ? Math.max(0, limit - used)
        : null;

  return { used, limit, remaining };
}

function pickRateLimitUsage(rateLimits: Record<string, unknown> | null): {
  used: number | null;
  limit: number | null;
  remaining: number | null;
} {
  if (!rateLimits) {
    return { used: null, limit: null, remaining: null };
  }

  const priorities = [
    "per-minute",
    "per-hour",
    "per-day",
    "per-month",
    "per-second",
  ];

  const candidates = priorities
    .map((key) => parseRateLimitWindow(asRecord(rateLimits[key])))
    .filter((item) => item.used !== null || item.limit !== null || item.remaining !== null);

  if (candidates.length === 0) {
    return { used: null, limit: null, remaining: null };
  }

  const complete = candidates.find((item) => item.used !== null && item.limit !== null);
  if (complete) {
    return complete;
  }

  return candidates[0];
}

export function parseVendorUsagePayload(payload: unknown): VendorUsage {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const usage = asRecord(root?.usage);
  const requests = asRecord(root?.requests);
  const account = asRecord(root?.account);
  const current = asRecord(root?.current);
  const rateLimit = asRecord(root?.rateLimit);
  const rateLimits = asRecord(data?.rateLimits) || asRecord(root?.rateLimits);

  const records = [root, data, usage, requests, account, current, rateLimit];

  const fromRateLimits = pickRateLimitUsage(rateLimits);
  const used =
    fromRateLimits.used ??
    pickNumericValue(records, ["used", "requestsUsed", "requestUsed", "currentUsed"]);
  const limit =
    fromRateLimits.limit ??
    pickNumericValue(records, ["limit", "requestsLimit", "requestLimit", "max"]);
  const remainingRaw =
    fromRateLimits.remaining ??
    pickNumericValue(records, ["remaining", "requestsRemaining", "requestRemaining"]);

  const remaining =
    remainingRaw !== null
      ? remainingRaw
      : used !== null && limit !== null
        ? Math.max(0, limit - used)
        : null;

  const utilizationPct =
    used !== null && limit !== null && limit > 0
      ? Number(((used / limit) * 100).toFixed(2))
      : null;

  return {
    used,
    limit,
    remaining,
    utilizationPct,
  };
}
