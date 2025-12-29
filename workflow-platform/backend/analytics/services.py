# analytics/services.py
from django.db.models import Count, Avg, Max, Q, F
from django.utils import timezone
from datetime import timedelta
from runs.models import WorkflowRun, StepRun
from workflows.models import Workflow
from typing import Dict, Any, List

class AnalyticsService:
    """Enhanced analytics with deeper insights"""
    
    def get_overview_stats(self, days: int = 7) -> Dict[str, Any]:
        """Get comprehensive overview analytics"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Total runs
        total_runs = WorkflowRun.objects.filter(started_at__gte=start_date).count()
        
        if total_runs == 0:
            return self._empty_overview()
        
        # Success rate
        success_count = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).count()
        success_rate = success_count / total_runs
        failed_count = total_runs - success_count
        
        # Average duration
        avg_duration = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0
        
        # Percentiles
        runs = WorkflowRun.objects.filter(
            started_at__gte=start_date,
            status='success'
        ).order_by('duration_ms').values_list('duration_ms', flat=True)
        
        p50_duration = self._calculate_percentile(list(runs), 50)
        p95_duration = self._calculate_percentile(list(runs), 95)
        p99_duration = self._calculate_percentile(list(runs), 99)
        
        # Trend calculation
        prev_start = start_date - timedelta(days=days)
        prev_runs = WorkflowRun.objects.filter(
            started_at__gte=prev_start,
            started_at__lt=start_date
        )
        prev_success_rate = (
            prev_runs.filter(status='success').count() / prev_runs.count()
            if prev_runs.count() > 0 else success_rate
        )
        success_rate_trend = ((success_rate - prev_success_rate) / prev_success_rate * 100) if prev_success_rate > 0 else 0
        
        return {
            'total_runs': total_runs,
            'successful_runs': success_count,
            'failed_runs': failed_count,
            'success_rate': round(success_rate, 4),
            'success_rate_trend': round(success_rate_trend, 2),
            'avg_duration_ms': int(avg_duration),
            'p50_duration_ms': p50_duration,
            'p95_duration_ms': p95_duration,
            'p99_duration_ms': p99_duration,
            'period_days': days
        }
    
    def get_time_series(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get detailed time series with multiple metrics"""
        start_date = timezone.now() - timedelta(days=days)
        
        # Group by date
        runs_by_date = {}
        runs = WorkflowRun.objects.filter(started_at__gte=start_date)
        
        for run in runs:
            date_key = run.started_at.strftime('%Y-%m-%d')
            if date_key not in runs_by_date:
                runs_by_date[date_key] = {
                    'timestamp': date_key,
                    'successful': 0,
                    'failed': 0,
                    'durations': []
                }
            
            if run.status == 'success':
                runs_by_date[date_key]['successful'] += 1
            elif run.status == 'failed':
                runs_by_date[date_key]['failed'] += 1
            
            runs_by_date[date_key]['durations'].append(run.duration_ms)
        
        # Calculate metrics for each day
        result = []
        for date_key, data in sorted(runs_by_date.items()):
            total = data['successful'] + data['failed']
            durations = sorted(data['durations'])
            
            result.append({
                'timestamp': data['timestamp'],
                'total_runs': total,
                'successful': data['successful'],
                'failed': data['failed'],
                'success_rate': round(data['successful'] / total if total > 0 else 0, 4),
                'avg_duration_ms': int(sum(durations) / len(durations)) if durations else 0,
                'p95_latency_ms': self._calculate_percentile(durations, 95),
                'workflows_active': total
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
        
        if total_errors == 0:
            return []
        
        for run in failed_runs:
            # Categorize errors
            error_msg = (run.error_message or '').lower()
            if 'timeout' in error_msg:
                error_type = 'Timeout'
            elif 'auth' in error_msg or 'unauthorized' in error_msg or '401' in error_msg:
                error_type = 'Authentication'
            elif 'rate limit' in error_msg or '429' in error_msg:
                error_type = 'Rate Limit'
            elif 'not found' in error_msg or '404' in error_msg:
                error_type = 'Not Found'
            elif 'validation' in error_msg or '400' in error_msg:
                error_type = 'Validation'
            else:
                error_type = 'Other'
            
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        result = []
        for error_type, count in sorted(error_types.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_errors * 100) if total_errors > 0 else 0
            result.append({
                'type': error_type,
                'count': count,
                'percentage': round(percentage, 1)
            })
        
        return result
    
    def get_workflow_performance(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get detailed per-workflow performance with trends"""
        start_date = timezone.now() - timedelta(days=days)
        prev_start = start_date - timedelta(days=days)
        
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
            sorted_runs = list(success_runs.order_by('duration_ms').values_list('duration_ms', flat=True))
            p95_duration = self._calculate_percentile(sorted_runs, 95)
            
            # Trend
            prev_runs = WorkflowRun.objects.filter(
                workflow=workflow,
                started_at__gte=prev_start,
                started_at__lt=start_date
            )
            prev_success_rate = (
                prev_runs.filter(status='success').count() / prev_runs.count()
                if prev_runs.count() > 0 else success_rate
            )
            success_change = ((success_rate - prev_success_rate) / prev_success_rate * 100) if prev_success_rate > 0 else 0
            
            result.append({
                'id': workflow.id,
                'name': workflow.name,
                'total_runs': total_runs,
                'successful_runs': success_count,
                'failed_runs': total_runs - success_count,
                'success_rate': round(success_rate, 4),
                'success_rate_change': round(success_change, 2),
                'avg_duration_ms': int(avg_duration),
                'p95_duration_ms': p95_duration,
                'trend': 'up' if success_change > 0 else 'down' if success_change < 0 else 'stable'
            })
        
        return sorted(result, key=lambda x: x['total_runs'], reverse=True)
    
    def get_step_diagnostics(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get step-level diagnostics with bottleneck analysis"""
        start_date = timezone.now() - timedelta(days=days)
        
        steps = StepRun.objects.filter(started_at__gte=start_date)
        
        step_stats = {}
        for step in steps:
            name = step.step_name
            if name not in step_stats:
                step_stats[name] = {
                    'step_name': name,
                    'calls': 0,
                    'failed': 0,
                    'skipped': 0,
                    'durations': [],
                    'error_types': {}
                }
            
            step_stats[name]['calls'] += 1
            if step.status == 'failed':
                step_stats[name]['failed'] += 1
                error_type = self._categorize_single_error(step.error_message or '')
                step_stats[name]['error_types'][error_type] = step_stats[name]['error_types'].get(error_type, 0) + 1
            elif step.status == 'skipped':
                step_stats[name]['skipped'] += 1
            
            step_stats[name]['durations'].append(step.duration_ms)
        
        result = []
        for name, stats in step_stats.items():
            durations = sorted(stats['durations'])
            avg_duration = sum(durations) / len(durations) if durations else 0
            success_count = stats['calls'] - stats['failed'] - stats['skipped']
            
            result.append({
                'step_name': name,
                'total_calls': stats['calls'],
                'successful': success_count,
                'failed': stats['failed'],
                'skipped': stats['skipped'],
                'success_rate': round(success_count / stats['calls'] if stats['calls'] > 0 else 0, 4),
                'avg_duration_ms': int(avg_duration),
                'p95_duration_ms': self._calculate_percentile(durations, 95),
                'p99_duration_ms': self._calculate_percentile(durations, 99),
                'max_duration_ms': max(durations) if durations else 0,
                'is_bottleneck': avg_duration > 5000  # Flag if > 5 seconds
            })
        
        return sorted(result, key=lambda x: x['avg_duration_ms'], reverse=True)
    
    def get_host_health(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get dependency/host health metrics"""
        # Placeholder - tracks integration health from step runs
        start_date = timezone.now() - timedelta(days=days)
        
        step_runs = StepRun.objects.filter(started_at__gte=start_date)
        
        host_stats = {}
        for step in step_runs:
            # Extract integration from workflow or metadata
            host = 'Unknown'
            if hasattr(step, 'metadata') and step.metadata:
                host = step.metadata.get('integration', 'Unknown')
            
            if host not in host_stats:
                host_stats[host] = {
                    'calls': 0,
                    'failed': 0,
                    'durations': []
                }
            
            host_stats[host]['calls'] += 1
            if step.status == 'failed':
                host_stats[host]['failed'] += 1
            host_stats[host]['durations'].append(step.duration_ms)
        
        result = []
        for host, stats in host_stats.items():
            durations = sorted(stats['durations'])
            error_rate = stats['failed'] / stats['calls'] if stats['calls'] > 0 else 0
            
            result.append({
                'host': host,
                'calls': stats['calls'],
                'p95_latency_ms': self._calculate_percentile(durations, 95),
                'error_rate': round(error_rate, 4),
                'status': 'healthy' if error_rate < 0.05 else 'degraded' if error_rate < 0.1 else 'down'
            })
        
        return sorted(result, key=lambda x: x['calls'], reverse=True)
    
    # Helper methods
    def _calculate_percentile(self, data: List[int], percentile: int) -> int:
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    def _categorize_single_error(self, error_msg: str) -> str:
        error_lower = error_msg.lower()
        if 'timeout' in error_lower:
            return 'Timeout'
        elif 'auth' in error_lower or '401' in error_lower:
            return 'Authentication'
        elif 'rate limit' in error_lower or '429' in error_lower:
            return 'Rate Limit'
        elif '404' in error_lower:
            return 'Not Found'
        elif '400' in error_lower:
            return 'Validation'
        else:
            return 'Other'

    def _empty_overview(self) -> Dict[str, Any]:
        return {
            'total_runs': 0,
            'successful_runs': 0,
            'failed_runs': 0,
            'success_rate': 0,
            'success_rate_trend': 0,
            'avg_duration_ms': 0,
            'p50_duration_ms': 0,
            'p95_duration_ms': 0,
            'p99_duration_ms': 0,
            'period_days': 0
        }
