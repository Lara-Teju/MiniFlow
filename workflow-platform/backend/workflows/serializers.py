# workflows/serializers.py
from rest_framework import serializers
from .models import Workflow, WorkflowStep

class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = ['id', 'order', 'action_type', 'app_id', 'config']

class WorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workflow
        fields = [
            'id', 'name', 'description', 'enabled',
            'created_at', 'updated_at', 'total_runs',
            'last_run', 'steps'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_runs', 'last_run']

class WorkflowCreateSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, required=False)
    
    class Meta:
        model = Workflow
        fields = ['name', 'description', 'enabled', 'steps']
    
    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        workflow = Workflow.objects.create(**validated_data)
        
        for step_data in steps_data:
            WorkflowStep.objects.create(workflow=workflow, **step_data)
        
        return workflow