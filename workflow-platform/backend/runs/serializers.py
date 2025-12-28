# runs/serializers.py
from rest_framework import serializers
from .models import WorkflowRun, StepRun

class StepRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepRun
        fields = [
            'step_id', 'step_name', 'order', 'status',
            'started_at', 'completed_at', 'duration_ms',
            'input_data', 'output_data', 'error_message'
        ]

class WorkflowRunSerializer(serializers.ModelSerializer):
    step_runs = StepRunSerializer(many=True, read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    workflow_id = serializers.CharField(source='workflow.id', read_only=True)
    
    class Meta:
        model = WorkflowRun
        fields = [
            'run_id', 'workflow_id', 'workflow_name', 'status',
            'inputs', 'started_at', 'completed_at', 'duration_ms',
            'error_message', 'step_runs'
        ]