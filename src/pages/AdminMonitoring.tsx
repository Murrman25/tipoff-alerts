import { useEffect, useMemo } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageGlow } from "@/components/PageGlow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMonitoring } from "@/hooks/useAdminMonitoring";
import { useAdminMonitoringHistory } from "@/hooks/useAdminMonitoringHistory";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { TipoffApiError } from "@/lib/tipoffApi";

function fmtNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString();
}

function fmtPct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(2)}%`;
}

export default function AdminMonitoring() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const canLoadAdminData = Boolean(user && isAdmin);

  const summaryQuery = useAdminMonitoring(undefined, canLoadAdminData);
  const historyQuery = useAdminMonitoringHistory({ hours: 24, enabled: canLoadAdminData });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/admin/monitoring");
    }
  }, [authLoading, user, navigate]);

  const summary = summaryQuery.data?.data;

  const history = historyQuery.data?.data || [];
  const chartData = useMemo(
    () =>
      history.map((point) => ({
        time: new Date(point.sampledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        utilization: point.vendorUtilizationPct,
        redisPingMs: point.redisPingMs,
        oddsBacklog: point.streamOddsLen,
      })),
    [history],
  );

  if (authLoading || (user && summaryQuery.isLoading && !summary)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notAuthorized =
    !isAdmin ||
    (summaryQuery.error instanceof TipoffApiError && summaryQuery.error.status === 403);

  if (notAuthorized) {
    return (
      <div className="min-h-screen bg-background relative">
        <PageGlow />
        <main className="container px-4 md:px-6 py-10 max-w-3xl mx-auto">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                Not authorized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This monitoring page is restricted to approved TipOff admin emails.
              </p>
              <div className="mt-4">
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PageGlow />
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Admin Monitoring</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => summaryQuery.refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              Overall: <span className="font-medium uppercase">{summary?.overallStatus || "-"}</span>
            </div>
            <div>Environment: {summary?.environment || "-"}</div>
            <div>As of: {summary?.asOf ? new Date(summary.asOf).toLocaleString() : "-"}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>SportsGameOdds Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Used: {fmtNumber(summary?.vendorUsage.used)}</div>
              <div>Limit: {fmtNumber(summary?.vendorUsage.limit)}</div>
              <div>Remaining: {fmtNumber(summary?.vendorUsage.remaining)}</div>
              <div>Utilization: {fmtPct(summary?.vendorUsage.utilizationPct)}</div>
              <div>Stale: {summary?.vendorUsage.stale ? "yes" : "no"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Worker Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Ingestion heartbeat age: {fmtNumber(summary?.workers.ingestion.heartbeatAgeSeconds)}s</div>
              <div>Ingestion cycle age: {fmtNumber(summary?.workers.ingestion.cycleAgeSeconds)}s</div>
              <div>Alert heartbeat age: {fmtNumber(summary?.workers.alert.heartbeatAgeSeconds)}s</div>
              <div>Notification heartbeat age: {fmtNumber(summary?.workers.notification.heartbeatAgeSeconds)}s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redis Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Ping: {fmtNumber(summary?.redis.pingMs)} ms</div>
              <div>Odds stream backlog: {fmtNumber(summary?.redis.streams.oddsTicks)}</div>
              <div>Status stream backlog: {fmtNumber(summary?.redis.streams.eventStatusTicks)}</div>
              <div>Notification stream backlog: {fmtNumber(summary?.redis.streams.notificationJobs)}</div>
              <div>Backlog warn: {summary?.redis.backlogWarnExceeded ? "yes" : "no"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>24h Vendor Utilization %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="utilization" stroke="hsl(var(--primary))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>24h Redis / Backlog Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="redisPingMs" stroke="#22c55e" dot={false} />
                    <Line type="monotone" dataKey="oddsBacklog" stroke="#f59e0b" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
