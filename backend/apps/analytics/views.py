"""
apps/analytics/views.py
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from apps.workflows.models import Workflow, WorkflowExecution

@api_view(['GET'])
def dashboard_stats(request):
    """Get overall dashboard statistics"""
    total_workflows = Workflow.objects.filter(is_enabled=True).count()
    total_executions = WorkflowExecution.objects.count()
    
    success_count = WorkflowExecution.objects.filter(status='success').count()
    success_rate = round((success_count / total_executions * 100), 1) if total_executions > 0 else 0
    
    avg_duration = WorkflowExecution.objects.aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0
    
    # Last 24 hours stats
    yesterday = timezone.now() - timedelta(hours=24)
    recent_executions = WorkflowExecution.objects.filter(started_at__gte=yesterday).count()
    
    return Response({
        'total_workflows': total_workflows,
        'total_executions': total_executions,
        'success_rate': success_rate,
        'avg_duration_ms': round(avg_duration, 0),
        'recent_executions_24h': recent_executions
    })

@api_view(['GET'])
def execution_trends(request):
    """Get execution trends over time"""
    days = int(request.query_params.get('days', 7))
    start_date = timezone.now() - timedelta(days=days)
    
    executions = WorkflowExecution.objects.filter(started_at__gte=start_date)
    
    # Group by date
    daily_stats = []
    for i in range(days):
        date = timezone.now() - timedelta(days=days-i-1)
        day_start = date.replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        
        day_executions = executions.filter(started_at__gte=day_start, started_at__lt=day_end)
        total = day_executions.count()
        success = day_executions.filter(status='success').count()
        
        daily_stats.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'total': total,
            'success': success,
            'failed': total - success,
            'success_rate': round((success / total * 100), 1) if total > 0 else 0
        })
    
    return Response(daily_stats)

@api_view(['GET'])
def workflow_performance(request):
    """Get performance metrics for each workflow"""
    workflows = Workflow.objects.all()
    
    stats = []
    for workflow in workflows:
        executions = workflow.executions.all()
        total = executions.count()
        success = executions.filter(status='success').count()
        avg_duration = executions.aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0
        
        stats.append({
            'id': workflow.id,
            'name': workflow.name,
            'total_runs': total,
            'success_count': success,
            'failed_count': total - success,
            'success_rate': round((success / total * 100), 1) if total > 0 else 0,
            'avg_duration_ms': round(avg_duration, 0),
            'trigger_app': workflow.trigger_app,
            'action_app': workflow.action_app
        })
    
    return Response(stats)

@api_view(['GET'])
def error_breakdown(request):
    """Get breakdown of error types"""
    failed_executions = WorkflowExecution.objects.filter(status='failed').exclude(error_message='')
    
    error_counts = {}
    for execution in failed_executions:
        error = execution.error_message[:50]  # First 50 chars
        error_counts[error] = error_counts.get(error, 0) + 1
    
    breakdown = [{'error': k, 'count': v} for k, v in error_counts.items()]
    breakdown.sort(key=lambda x: x['count'], reverse=True)
    
    return Response(breakdown[:10])  # Top 10 errors
