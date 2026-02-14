export const MONITORING_ENVIRONMENTS = ['staging', 'production'] as const;

export type MonitoringEnvironment = (typeof MONITORING_ENVIRONMENTS)[number];
export type MonitoringEnvironmentQuery = MonitoringEnvironment | 'auto';

export function asMonitoringEnvironment(value: string | null | undefined): MonitoringEnvironment | null {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'staging' || normalized === 'production') {
    return normalized;
  }

  return null;
}

export function normalizeEnvironmentQuery(
  rawValue: string | null | undefined,
): MonitoringEnvironmentQuery | null {
  const normalized = (rawValue || '').trim().toLowerCase();
  if (normalized === '' || normalized === 'auto') {
    return 'auto';
  }

  return asMonitoringEnvironment(normalized);
}

export function resolveEnvironmentSelection(params: {
  requestedEnvironment: MonitoringEnvironmentQuery;
  availableEnvironments: MonitoringEnvironment[];
  latestEnvironment: MonitoringEnvironment | null;
}): MonitoringEnvironment | null {
  if (params.requestedEnvironment === 'auto') {
    return params.latestEnvironment;
  }

  return params.requestedEnvironment;
}
