# runs/models.py
from django.db import models
from workflows.models import Workflow
import uuid

class WorkflowRun(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    run_id = models.CharField(max_length=50, primary_key=True, editable=False)
    workflow = models.ForeignKey(Workflow, related_name='runs', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    inputs = models.JSONField(default=dict)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        if not self.run_id:
            self.run_id = f"run_{uuid.uuid4().hex[:12]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.workflow.name} - {self.run_id}"
    
    class Meta:
        ordering = ['-started_at']

class StepRun(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    step_id = models.CharField(max_length=50, primary_key=True, editable=False)
    run = models.ForeignKey(WorkflowRun, related_name='step_runs', on_delete=models.CASCADE)
    step_name = models.CharField(max_length=255)
    order = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        if not self.step_id:
            self.step_id = f"steprun_{uuid.uuid4().hex[:12]}"
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['order']
