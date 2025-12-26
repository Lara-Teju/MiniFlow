"""
apps/workflows/serializers.py
"""
from rest_framework import serializers
from .models import Workflow, WorkflowExecution

class WorkflowSerializer(serializers.ModelSerializer):
    execution_count = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Workflow
        fields = '__all__'
    
    def get_execution_count(self, obj):
        return obj.executions.count()
    
    def get_success_rate(self, obj):
        total = obj.executions.count()
        if total == 0:
            return 0
        success = obj.executions.filter(status='success').count()
        return round((success / total) * 100, 1)

class WorkflowExecutionSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    class Meta:
        model = WorkflowExecution
        fields = '__all__'

