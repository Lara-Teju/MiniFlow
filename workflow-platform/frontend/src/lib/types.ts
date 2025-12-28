// src/lib/types.ts
export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  total_runs: number;
  last_run: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  order: number;
  action_type: string;
  app_id: string;
  config: Record<string, any>;
}

export interface Integration {
  id: string;
  app_type: 'slack' | 'notion' | 'trello' | 'google_calendar';
  label: string;
  linked: boolean;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  linked: boolean;
  label?: string;
  actions: AppAction[];
  needsSecret?: boolean;
}

export interface AppAction {
  id: string;
  name: string;
  description?: string;
  fields: ActionField[];
}

export interface ActionField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  inputs: Record<string, any>;
  started_at: string;
  completed_at: string | null;
  duration_ms: number;
  error_message: string;
  step_runs: StepRun[];
}

export interface StepRun {
  step_id: string;
  step_name: string;
  order: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  started_at: string;
  completed_at: string | null;
  duration_ms: number;
  input_data: Record<string, any>;
  output_data: Record<string, any> | null;
  error_message: string;
}

export interface Analytics {
  total_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  failures: number;
  timeSeries: TimeSeriesData[];
  errors: ErrorData[];
  workflows: WorkflowPerformance[];
  steps: StepDiagnostic[];
  hosts: HostHealth[];
}

export interface TimeSeriesData {
  timestamp: string;
  success: number;
  failed: number;
  p95_latency: number;
}

export interface ErrorData {
  type: string;
  count: number;
  percentage: number;
}

export interface WorkflowPerformance {
  id: string;
  name: string;
  runs: number;
  success_rate: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  change_vs_previous: number;
}

export interface StepDiagnostic {
  step_name: string;
  calls: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  failure_rate: number;
}

export interface HostHealth {
  host: string;
  calls: number;
  p95_latency_ms: number;
  error_rate: number;
}