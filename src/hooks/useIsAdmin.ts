import { useMemo } from "react";

import { useAuth } from "@/hooks/useAuth";

const FALLBACK_ADMIN_EMAILS = ["a25murray@gmail.com"];

function parseAllowedEmails(raw: string | undefined): Set<string> {
  if (!raw || raw.trim().length === 0) {
    return new Set(FALLBACK_ADMIN_EMAILS);
  }

  const values = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (values.length === 0) {
    return new Set(FALLBACK_ADMIN_EMAILS);
  }

  return new Set(values);
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    const email = user?.email?.toLowerCase();
    if (!email) {
      return false;
    }

    const allowed = parseAllowedEmails(import.meta.env.VITE_TIPOFF_ADMIN_EMAILS);
    return allowed.has(email);
  }, [user?.email]);
}
