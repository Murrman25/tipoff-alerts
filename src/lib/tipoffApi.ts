import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SUPABASE_URL = "https://wxcezmqaknhftwnpkanu.supabase.co";
const DEFAULT_FUNCTION_BASE = `${DEFAULT_SUPABASE_URL}/functions/v1/tipoff-api`;

export const TIPOFF_API_BASE_URL =
  import.meta.env.VITE_TIPOFF_API_BASE_URL || DEFAULT_FUNCTION_BASE;

interface ApiErrorBody {
  error?: string;
}

export class TipoffApiError extends Error {
  readonly status: number;
  readonly isRateLimited: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TipoffApiError";
    this.status = status;
    this.isRateLimited = status === 429;
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${TIPOFF_API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function tipoffFetch<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    auth?: boolean;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  },
): Promise<T> {
  const method = options?.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error("Authentication required");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new TipoffApiError(
      errorData.error || `Request failed (${response.status})`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function isRateLimitedError(error: unknown): boolean {
  return error instanceof TipoffApiError && error.isRateLimited;
}
