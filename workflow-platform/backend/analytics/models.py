from django.db import models
from django.utils import timezone
from workflows.models import Workflow

class WorkflowMetrics(models.Model):
    """Store aggregated metrics per workflow"""
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField(auto_now_add=True, db_index=True)
    
    # Execution metrics
    total_runs = models.IntegerField(default=0)
    successful_runs = models.IntegerField(default=0)
    failed_runs = models.IntegerField(default=0)
    success_rate = models.FloatField(default=0.0)
    
    # Performance metrics
    avg_duration_ms = models.IntegerField(default=0)
    median_duration_ms = models.IntegerField(default=0)
    p95_duration_ms = models.IntegerField(default=0)
    p99_duration_ms = models.IntegerField(default=0)
    min_duration_ms = models.IntegerField(default=0)
    max_duration_ms = models.IntegerField(default=0)
    
    # Error metrics
    timeout_errors = models.IntegerField(default=0)
    auth_errors = models.IntegerField(default=0)
    rate_limit_errors = models.IntegerField(default=0)
    other_errors = models.IntegerField(default=0)
    
    # Trend
    duration_change_percent = models.FloatField(default=0.0)  # vs previous day
    success_rate_change_percent = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('workflow', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['workflow', '-date']),
        ]

class StepMetrics(models.Model):
    """Store aggregated step-level metrics"""
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    step_name = models.CharField(max_length=255, db_index=True)
    date = models.DateField(auto_now_add=True, db_index=True)
    
    # Execution
    total_calls = models.IntegerField(default=0)
    successful_calls = models.IntegerField(default=0)
    failed_calls = models.IntegerField(default=0)
    skipped_calls = models.IntegerField(default=0)
    success_rate = models.FloatField(default=0.0)
    
    # Performance
    avg_duration_ms = models.IntegerField(default=0)
    p95_duration_ms = models.IntegerField(default=0)
    p99_duration_ms = models.IntegerField(default=0)
    max_duration_ms = models.IntegerField(default=0)
    
    # Errors
    timeout_count = models.IntegerField(default=0)
    validation_errors = models.IntegerField(default=0)
    integration_errors = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('workflow', 'step_name', 'date')
        ordering = ['-date']

class IntegrationHealth(models.Model):
    """Track integration/host health metrics"""
    integration_name = models.CharField(max_length=255, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    total_calls = models.IntegerField(default=0)
    successful_calls = models.IntegerField(default=0)
    failed_calls = models.IntegerField(default=0)
    
    avg_response_time_ms = models.IntegerField(default=0)
    p95_response_time_ms = models.IntegerField(default=0)
    p99_response_time_ms = models.IntegerField(default=0)
    
    error_rate = models.FloatField(default=0.0)
    availability_percent = models.FloatField(default=100.0)
    
    status = models.CharField(
        max_length=20,
        choices=[('healthy', 'Healthy'), ('degraded', 'Degraded'), ('down', 'Down')],
        default='healthy'
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['integration_name', '-timestamp']),
        ]
