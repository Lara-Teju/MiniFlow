"""
apps/workflows/models.py
"""
from django.db import models
from django.utils import timezone
import json

class Workflow(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    trigger_app = models.CharField(max_length=50)  # airtable
    trigger_action = models.CharField(max_length=100)  # new_record
    trigger_config = models.JSONField(default=dict)
    
    action_app = models.CharField(max_length=50)  # sendgrid
    action_type = models.CharField(max_length=100)  # send_email
    action_config = models.JSONField(default=dict)
    
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workflows'
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name


class WorkflowExecution(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial Success'),
    ]
    
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='executions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    trigger_data = models.JSONField(default=dict)
    action_result = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'workflow_executions'
        ordering = ['-started_at']
        
    def __str__(self):
        return f"{self.workflow.name} - {self.status} - {self.started_at}"
