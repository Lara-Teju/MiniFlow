# workflows/admin.py
from django.contrib import admin
from .models import Workflow, WorkflowStep

@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'enabled', 'total_runs', 'created_at']
    list_filter = ['enabled', 'created_at']
    search_fields = ['name', 'description']

@admin.register(WorkflowStep)
class WorkflowStepAdmin(admin.ModelAdmin):
    list_display = ['id', 'workflow', 'order', 'action_type', 'app_id']
    list_filter = ['action_type', 'app_id']

