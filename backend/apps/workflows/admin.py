"""
apps/workflows/admin.py
"""
from django.contrib import admin
from .models import Workflow, WorkflowExecution

@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ['name', 'trigger_app', 'action_app', 'is_enabled', 'created_at']
    list_filter = ['trigger_app', 'action_app', 'is_enabled']
    search_fields = ['name', 'description']

@admin.register(WorkflowExecution)
class WorkflowExecutionAdmin(admin.ModelAdmin):
    list_display = ['workflow', 'status', 'duration_ms', 'started_at']
    list_filter = ['status', 'workflow']
    date_hierarchy = 'started_at'