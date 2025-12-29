// src/pages/AnalyticsPage.tsx
import { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, Download, Share2,
  ChevronRight, BarChart3, Zap, Heart, AlertCircle
} from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import type { Analytics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatPercent, formatDuration, cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area, AreaChart
} from 'recharts';

const COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  primary: '#0d9488',
  warning: '#f59e0b',
  healthy: '#10b981',
  degraded: '#f59e0b',
  down: '#ef4444'
};

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
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
      <div className="p-6 flex items-center justify-center h-96">
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
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Last {period} days</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
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

      {/* KPI Row - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Runs"
          value={analytics.total_runs}
          subtitle={`${analytics.successful_runs} successful`}
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="Success Rate"
          value={formatPercent(analytics.success_rate)}
          subtitle={`${analytics.success_rate_trend > 0 ? '+' : ''}${analytics.success_rate_trend}% vs last period`}
          variant={analytics.success_rate >= 0.95 ? 'success' : analytics.success_rate >= 0.85 ? 'warning' : 'destructive'}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={analytics.success_rate_trend}
        />
        <KPICard
          title="Avg Duration"
          value={formatDuration(analytics.avg_duration_ms)}
          subtitle={`Median: ${formatDuration(analytics.p50_duration_ms)}`}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="P95 Latency"
          value={formatDuration(analytics.p95_duration_ms)}
          subtitle={`P99: ${formatDuration(analytics.p99_duration_ms)}`}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <KPICard
          title="Failures"
          value={analytics.failed_runs}
          subtitle={`${formatPercent(analytics.failed_runs / analytics.total_runs)} failure rate`}
          variant={analytics.failed_runs > 20 ? 'destructive' : 'warning'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="steps">Steps & Bottlenecks</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Execution Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="timestamp" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_runs" fill={COLORS.primary} name="Total Runs" />
                  <Bar yAxisId="left" dataKey="successful" fill={COLORS.success} name="Successful" />
                  <Bar yAxisId="left" dataKey="failed" fill={COLORS.failed} name="Failed" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="success_rate"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Success Rate"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Error Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Error Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.errors && analytics.errors.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.errors.map((error, index) => (
                      <div key={error.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#6b7280'][index % 4]
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{error.type}</p>
                            <p className="text-xs text-muted-foreground">{error.count} errors</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{error.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No errors in this period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Latency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.avg_duration_ms)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">P50 (Median)</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.p50_duration_ms)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">P95</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.p95_duration_ms)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">P99</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.p99_duration_ms)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Workflow Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Workflow</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Runs</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Success</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Duration</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">P95</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.workflows?.map((wf) => (
                      <tr key={wf.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{wf.name}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{wf.total_runs}</td>
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
                        <td className="py-3 px-4 text-right">
                          {wf.success_rate_change > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 inline" />
                          ) : wf.success_rate_change < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-600 inline" />
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Step-Level Diagnostics & Bottlenecks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Step</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Calls</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Success</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">P95</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.steps?.map((step) => (
                      <tr
                        key={step.step_name}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/50 transition-colors",
                          step.is_bottleneck && "bg-yellow-50/50 dark:bg-yellow-950/20"
                        )}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {step.is_bottleneck && (
                              <Zap className="w-4 h-4 text-yellow-600" title="Bottleneck detected" />
                            )}
                            <span className="font-medium text-foreground">{step.step_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{step.total_calls}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "font-medium",
                            step.success_rate >= 0.95 ? "text-green-600" :
                            step.success_rate >= 0.85 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {formatPercent(step.success_rate)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {formatDuration(step.avg_duration_ms)}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {formatDuration(step.p95_duration_ms)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {step.failed > 0 && (
                            <div className="flex items-center justify-end gap-1">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-xs text-red-600 font-medium">{step.failed} failed</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Integration Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {analytics.hosts?.map((host) => (
                  <div
                    key={host.host}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          host.error_rate < 0.05 ? "bg-green-500" :
                          host.error_rate < 0.1 ? "bg-yellow-500" : "bg-red-500"
                        )} />
                        <h4 className="font-medium text-foreground">{host.host}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                        backgroundColor: host.error_rate < 0.05 ? '#d1fae5' :
                          host.error_rate < 0.1 ? '#fef3c7' : '#fee2e2',
                        color: host.error_rate < 0.05 ? '#047857' :
                          host.error_rate < 0.1 ? '#92400e' : '#991b1b'
                      }}>
                        {host.error_rate < 0.05 ? 'Healthy' : host.error_rate < 0.1 ? 'Degraded' : 'Down'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Calls</p>
                        <p className="font-semibold">{host.calls}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Avg Latency</p>
                        <p className="font-semibold">{formatDuration(host.p95_latency_ms)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Error Rate</p>
                        <p className="font-semibold">{formatPercent(host.error_rate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Success</p>
                        <p className="font-semibold">{host.calls - Math.floor(host.calls * host.error_rate)}/{host.calls}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}