// src/pages/RunsPage.tsx
import { useState, useEffect } from 'react';
import { Search, Clock, Eye, Copy, RefreshCw, Download, X } from 'lucide-react';
import { runsAPI } from '@/lib/api';
import type { WorkflowRun } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { formatDuration, formatTime, formatDate } from '@/lib/utils';

export function RunsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const response = await runsAPI.list();
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setRuns(data);
    } catch (error) {
      toast.error('Failed to load runs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = runs.filter(run => {
    if (filters.search && !run.run_id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && run.status !== filters.status) {
      return false;
    }
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Run History</h2>
        <p className="text-muted-foreground mt-1">
          Showing {filteredRuns.length} of {runs.length} runs
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by run ID..."
                className="pl-9"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>

                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={loadRuns}>
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Runs List */}
      <div className="space-y-3">
        {filteredRuns.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">No runs found matching your filters</p>
            </div>
          </Card>
        ) : (
          filteredRuns.map((run) => (
            <Card
              key={run.run_id}
              className="hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedRun(run)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-medium">{run.run_id}</span>
                      <StatusBadge status={run.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {run.workflow_name}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDuration(run.duration_ms)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-foreground">{formatTime(run.started_at)}</p>
                      <p className="text-xs">{formatDate(run.started_at)}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Run Detail Sheet */}
      <Sheet open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedRun && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-mono">{selectedRun.run_id}</SheetTitle>
                  <StatusBadge status={selectedRun.status} />
                </div>
                <SheetDescription>{selectedRun.workflow_name}</SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="timeline" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="inputs">Inputs</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-4 space-y-4">
                  {/* Summary */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="text-sm font-medium">{formatTime(selectedRun.started_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">{formatDuration(selectedRun.duration_ms)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Steps</p>
                        <p className="text-sm font-medium">{selectedRun.step_runs?.length || 0}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Steps Timeline */}
                  <div className="space-y-3">
                    {selectedRun.step_runs?.map((step, index) => (
                      <Card key={step.step_id}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                              step.status === 'success' ? 'bg-green-100 text-green-800' :
                              step.status === 'failed' ? 'bg-red-100 text-red-800' :
                              step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{step.step_name}</p>
                                <StatusBadge status={step.status} size="sm" showIcon={false} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(step.duration_ms)}
                              </p>
                              {step.error_message && (
                                <div className="mt-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
                                  {step.error_message}
                                </div>
                              )}
                              {step.output_data && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Output:</p>
                                  <pre className="p-2 rounded-md bg-muted text-xs overflow-x-auto">
                                    {JSON.stringify(step.output_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="inputs" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Input Payload</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(selectedRun.inputs, null, 2))}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 rounded-lg bg-muted text-sm overflow-x-auto">
                        {JSON.stringify(selectedRun.inputs, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Full Run Data</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(selectedRun, null, 2))}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="p-3 rounded-lg bg-muted text-sm overflow-x-auto max-h-96">
                        {JSON.stringify(selectedRun, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                <Button className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-run
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
