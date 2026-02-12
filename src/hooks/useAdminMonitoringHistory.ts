import { useQuery } from "@tanstack/react-query";

import { fetchAdminMonitoringHistory } from "@/lib/adminMonitoringApi";

export function useAdminMonitoringHistory(
  params?: { hours?: number; environment?: string; enabled?: boolean },
) {
  return useQuery({
    queryKey: ["admin-monitoring-history", params?.hours || 24, params?.environment],
    queryFn: () => fetchAdminMonitoringHistory(params),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
    enabled: params?.enabled ?? true,
  });
}
