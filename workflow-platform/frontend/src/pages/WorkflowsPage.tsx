// src/pages/WorkflowsPage.tsx
import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Eye, Settings, Zap, Webhook } from 'lucide-react';
import { workflowsAPI } from '@/lib/api';
import type { Workflow } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await workflowsAPI.list();
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setWorkflows(data);
    } catch (error) {
      toast.error('Failed to load workflows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (workflow: Workflow) => {
    try {
      await workflowsAPI.update(workflow.id, { enabled: !workflow.enabled });
      toast.success(`Workflow ${workflow.enabled ? 'disabled' : 'enabled'}`);
      loadWorkflows();
    } catch (error) {
      toast.error('Failed to update workflow');
      console.error(error);
    }
  };

  const handleRun = async (workflow: Workflow) => {
    if (!workflow.enabled) {
      toast.error('Workflow must be enabled first');
      return;
    }

    try {
      const testPayload = {
        title: 'Test Task',
        description: 'Testing workflow execution',
        priority: 'medium',
        timestamp: new Date().toISOString()
      };
      
      await workflowsAPI.trigger(workflow.id, testPayload);
      toast.success('Workflow triggered successfully');
    } catch (error) {
      toast.error('Failed to trigger workflow');
      console.error(error);
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      await workflowsAPI.delete(workflow.id);
      toast.success('Workflow deleted');
      loadWorkflows();
    } catch (error) {
      toast.error('Failed to delete workflow');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workflows</h2>
          <p className="text-muted-foreground mt-1">
            {workflows.length} workflows • {workflows.filter(w => w.enabled).length} active
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first workflow to automate your tasks
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      workflow.enabled 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    workflow.enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {workflow.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{workflow.steps?.length || 0} steps</span>
                  <span>•</span>
                  <span>{workflow.total_runs} runs</span>
                  {workflow.last_run && (
                    <>
                      <span>•</span>
                      <span>Last: {new Date(workflow.last_run).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(workflow)}
                    className="flex-1"
                  >
                    {workflow.enabled ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1.5" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRun(workflow)}
                    disabled={!workflow.enabled}
                    className="flex-1"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Run Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(workflow)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
