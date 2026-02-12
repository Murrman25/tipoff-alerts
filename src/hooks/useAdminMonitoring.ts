import { useQuery } from "@tanstack/react-query";

import { fetchAdminMonitoringSummary } from "@/lib/adminMonitoringApi";

export function useAdminMonitoring(environment?: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-monitoring-summary", environment],
    queryFn: () => fetchAdminMonitoringSummary(environment),
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 1,
    enabled,
  });
}
