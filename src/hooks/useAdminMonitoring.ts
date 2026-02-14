import { useQuery } from "@tanstack/react-query";

import { AdminMonitoringEnvironmentQuery, fetchAdminMonitoringSummary } from "@/lib/adminMonitoringApi";

export function useAdminMonitoring(
  environment: AdminMonitoringEnvironmentQuery = "auto",
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin-monitoring-summary", environment],
    queryFn: () => fetchAdminMonitoringSummary(environment),
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 1,
    enabled,
  });
}
