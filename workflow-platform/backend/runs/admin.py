# runs/admin.py
from django.contrib import admin
from .models import WorkflowRun, StepRun

@admin.register(WorkflowRun)
class WorkflowRunAdmin(admin.ModelAdmin):
    list_display = ['run_id', 'workflow', 'status', 'started_at', 'duration_ms']
    list_filter = ['status', 'started_at']
    search_fields = ['run_id']

@admin.register(StepRun)
class StepRunAdmin(admin.ModelAdmin):
    list_display = ['step_id', 'run', 'step_name', 'status', 'duration_ms']
    list_filter = ['status']
