import { AlertsListResponse, alertsListResponseSchema } from "@/backend/contracts/api";
import { tipoffFetch } from "@/lib/tipoffApi";

export interface CreateAlertRequest {
  ruleType: string;
  eventID: string | null;
  marketType: string;
  teamSide: string | null;
  threshold: number | null;
  direction: string | null;
  timeWindow: string;
  gamePeriod?: string;
  channels: string[];
  eventName?: string;
}

export async function createAlert(body: CreateAlertRequest) {
  const payload = await tipoffFetch<unknown>("/alerts", {
    method: "POST",
    auth: true,
    body,
  });
  return payload;
}

export async function listAlerts(): Promise<AlertsListResponse["data"]> {
  const payload = await tipoffFetch<unknown>("/alerts", {
    auth: true,
  });
  const parsed = alertsListResponseSchema.parse(payload);
  return parsed.data;
}

export async function deleteAlertById(alertId: string) {
  await tipoffFetch(`/alerts/${alertId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function updateAlertStatus(alertId: string, isActive: boolean) {
  await tipoffFetch(`/alerts/${alertId}`, {
    method: "PATCH",
    auth: true,
    body: { is_active: isActive },
  });
}
