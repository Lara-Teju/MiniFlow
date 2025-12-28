# analytics/services.py
from django.db.models import Count, Avg, Max, Q, F
from django.utils import timezone
from datetime import timedelta
from runs.models import WorkflowRun, StepRun
from workflows.models import Workflow
from typing import Dict, Any, List

class AnalyticsService:
    def get_overview_stats(self, days: int = 7) -> Dict[str, Any]:
        """Get overview analytics for the dashboard"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Total runs
        total_runs = WorkflowRun.objects.filter(started_at__gte=start_date).count()
        
        # Success rate
        success_count = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).count()
        success_rate = success_count / total_runs if total_runs > 0 else 0
        
        # Average duration
        avg_duration = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0
        
        # P95 duration
        runs = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).order_by('duration_ms')
        p95_index = int(runs.count() * 0.95)
        p95_duration = runs[p95_index].duration_ms if runs.count() > 0 else 0
        
        # Failures
        failures = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='failed'
        ).count()
        
        return {
            'total_runs': total_runs,
            'success_rate': success_rate,
            'avg_duration_ms': int(avg_duration),
            'p95_duration_ms': p95_duration,
            'failures': failures
        }
    
    def get_time_series(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get time series data for runs"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Group by date
        runs_by_date = {}
        runs = WorkflowRun.objects.filter(started_at__gte=start_date)
        
        for run in runs:
            date_key = run.started_at.strftime('%Y-%m-%d')
            if date_key not in runs_by_date:
                runs_by_date[date_key] = {
                    'timestamp': date_key,
                    'success': 0,
                    'failed': 0,
                    'durations': []
                }
            
            if run.status == 'success':
                runs_by_date[date_key]['success'] += 1
            elif run.status == 'failed':
                runs_by_date[date_key]['failed'] += 1
            
            runs_by_date[date_key]['durations'].append(run.duration_ms)
        
        # Calculate P95 for each day
        result = []
        for date_key, data in sorted(runs_by_date.items()):
            durations = sorted(data['durations'])
            p95_index = int(len(durations) * 0.95) if durations else 0
            p95_latency = durations[p95_index] if durations else 0
            
            result.append({
                'timestamp': data['timestamp'],
                'success': data['success'],
                'failed': data['failed'],
                'p95_latency': p95_latency
            })
        
        return result
    
    def get_error_breakdown(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get error breakdown"""
        start_date = timezone.now() - timedelta(days=days)
        
        failed_runs = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='failed'
        )
        
        error_types = {}
        total_errors = failed_runs.count()
        
        for run in failed_runs:
            # Categorize errors
            error_msg = run.error_message.lower()
            if 'timeout' in error_msg:
                error_type = 'Timeout'
            elif 'auth' in error_msg or 'unauthorized' in error_msg:
                error_type = 'Authentication'
            elif 'rate limit' in error_msg:
                error_type = 'Rate Limit'
            else:
                error_type = 'Other'
            
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        result = []
        for error_type, count in error_types.items():
            percentage = (count / total_errors * 100) if total_errors > 0 else 0
            result.append({
                'type': error_type,
                'count': count,
                'percentage': round(percentage, 1)
            })
        
        return result
    
    def get_workflow_performance(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get per-workflow performance metrics"""
        start_date = timezone.now() - timedelta(days=days)
        
        workflows = Workflow.objects.all()
        result = []
        
        for workflow in workflows:
            runs = WorkflowRun.objects.filter(
                workflow=workflow,
                started_at__gte=start_date
            )
            
            total_runs = runs.count()
            if total_runs == 0:
                continue
            
            success_runs = runs.filter(status='success')
            success_count = success_runs.count()
            success_rate = success_count / total_runs
            
            avg_duration = success_runs.aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0
            
            # P95
            sorted_runs = success_runs.order_by('duration_ms')
            p95_index = int(sorted_runs.count() * 0.95)
            p95_duration = sorted_runs[p95_index].duration_ms if sorted_runs.count() > 0 else 0
            
            result.append({
                'id': workflow.id,
                'name': workflow.name,
                'runs': total_runs,
                'success_rate': success_rate,
                'avg_duration_ms': int(avg_duration),
                'p95_duration_ms': p95_duration,
                'change_vs_previous': 0  # TODO: Calculate vs previous period
            })
        
        return result
    
    def get_step_diagnostics(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get step-level performance metrics"""
        start_date = timezone.now() - timedelta(days=days)
        
        steps = StepRun.objects.filter(started_at__gte=start_date)
        
        step_stats = {}
        for step in steps:
            name = step.step_name
            if name not in step_stats:
                step_stats[name] = {
                    'step_name': name,
                    'calls': 0,
                    'failures': 0,
                    'durations': []
                }
            
            step_stats[name]['calls'] += 1
            if step.status == 'failed':
                step_stats[name]['failures'] += 1
            step_stats[name]['durations'].append(step.duration_ms)
        
        result = []
        for name, stats in step_stats.items():
            durations = sorted(stats['durations'])
            avg_duration = sum(durations) / len(durations) if durations else 0
            p95_index = int(len(durations) * 0.95)
            p95_duration = durations[p95_index] if durations else 0
            failure_rate = stats['failures'] / stats['calls'] if stats['calls'] > 0 else 0
            
            result.append({
                'step_name': name,
                'calls': stats['calls'],
                'avg_duration_ms': int(avg_duration),
                'p95_duration_ms': p95_duration,
                'failure_rate': failure_rate
            })
        
        return result
    
    def get_host_health(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get dependency/host health metrics"""
        # This is a simplified version - you'd track actual API hosts
        hosts_data = [
            {'host': 'api.slack.com', 'calls': 145, 'p95_latency_ms': 320, 'error_rate': 0.02},
            {'host': 'api.notion.com', 'calls': 89, 'p95_latency_ms': 450, 'error_rate': 0.05},
            {'host': 'api.trello.com', 'calls': 67, 'p95_latency_ms': 280, 'error_rate': 0.01},
            {'host': 'googleapis.com', 'calls': 54, 'p95_latency_ms': 380, 'error_rate': 0.03},
        ]
        return hosts_data
