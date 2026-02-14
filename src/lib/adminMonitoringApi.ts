import {
  AdminMonitoringHistoryResponse,
  AdminMonitoringSummaryResponse,
  adminMonitoringHistoryResponseSchema,
  adminMonitoringSummaryResponseSchema,
} from "@/backend/contracts/api";
import { tipoffFetch } from "@/lib/tipoffApi";

export type AdminMonitoringEnvironmentQuery = "auto" | "staging" | "production";

export async function fetchAdminMonitoringSummary(
  environment: AdminMonitoringEnvironmentQuery = "auto",
): Promise<AdminMonitoringSummaryResponse> {
  const payload = await tipoffFetch<unknown>("/admin/monitoring", {
    auth: true,
    query: {
      environment,
    },
  });

  return adminMonitoringSummaryResponseSchema.parse(payload);
}

export async function fetchAdminMonitoringHistory(params?: {
  hours?: number;
  environment?: AdminMonitoringEnvironmentQuery;
}): Promise<AdminMonitoringHistoryResponse> {
  const payload = await tipoffFetch<unknown>("/admin/monitoring/history", {
    auth: true,
    query: {
      hours: params?.hours,
      environment: params?.environment,
    },
  });

  return adminMonitoringHistoryResponseSchema.parse(payload);
}
