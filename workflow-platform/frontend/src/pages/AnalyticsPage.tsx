// src/pages/AnalyticsPage.tsx
import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, AlertTriangle, Download, Share2, ChevronRight } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import type { Analytics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { toast } from 'sonner';
import { formatPercent, formatDuration, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  primary: '#0d9488',
  warning: '#f59e0b',
};

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.get(parseInt(period));
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Runs"
          value={analytics.total_runs}
          subtitle="this period"
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="Success Rate"
          value={formatPercent(analytics.success_rate)}
          subtitle="target: 95%"
          variant={analytics.success_rate >= 0.9 ? 'success' : 'warning'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Avg Duration"
          value={formatDuration(analytics.avg_duration_ms)}
          subtitle={`P95: ${formatDuration(analytics.p95_duration_ms)}`}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Failures"
          value={analytics.failures}
          subtitle="this period"
          variant={analytics.failures > 10 ? 'destructive' : 'default'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Workflow Performance */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Workflow Performance</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Workflow</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Runs</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Success Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Duration</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">P95</th>
                </tr>
              </thead>
              <tbody>
                {analytics.workflows?.map((wf) => (
                  <tr key={wf.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{wf.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{wf.runs}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "font-medium",
                        wf.success_rate >= 0.95 ? "text-green-600" :
                        wf.success_rate >= 0.85 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {formatPercent(wf.success_rate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {formatDuration(wf.avg_duration_ms)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {formatDuration(wf.p95_duration_ms)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step-Level Diagnostics & Error Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step-Level Diagnostics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Step-Level Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Step</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Avg</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">P95</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Fail %</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.steps?.map((step) => (
                    <tr key={step.step_name} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3">
                        <span className="text-sm font-medium text-foreground">{step.step_name}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-sm text-muted-foreground">
                        {formatDuration(step.avg_duration_ms)}
                      </td>
                      <td className="py-2 px-3 text-right text-sm text-muted-foreground">
                        {formatDuration(step.p95_duration_ms)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={cn(
                          "text-sm font-medium",
                          step.failure_rate >= 0.1 ? "text-red-600" :
                          step.failure_rate >= 0.05 ? "text-yellow-600" : "text-green-600"
                        )}>
                          {formatPercent(step.failure_rate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Error Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Error Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.errors && analytics.errors.length > 0 ? (
              <div className="space-y-3">
                {analytics.errors.map((error, index) => (
                  <div key={error.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#ef4444', '#f97316', '#eab308', '#6b7280'][index % 4] }}
                      />
                      <span className="text-sm text-muted-foreground">{error.type}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {error.count} ({error.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No errors in this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dependency Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Dependency Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Host</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Calls</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">P95</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Error %</th>
                </tr>
              </thead>
              <tbody>
                {analytics.hosts?.map((host) => (
                  <tr key={host.host} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          host.error_rate >= 0.1 ? "bg-red-500" :
                          host.error_rate >= 0.05 ? "bg-yellow-500" : "bg-green-500"
                        )} />
                        <span className="text-sm font-medium text-foreground">{host.host}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-sm text-muted-foreground">{host.calls}</td>
                    <td className="py-2 px-3 text-right text-sm text-muted-foreground">
                      {formatDuration(host.p95_latency_ms)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={cn(
                        "text-sm font-medium",
                        host.error_rate >= 0.1 ? "text-red-600" :
                        host.error_rate >= 0.05 ? "text-yellow-600" : "text-green-600"
                      )}>
                        {formatPercent(host.error_rate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}