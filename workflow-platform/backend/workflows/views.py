# workflows/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Workflow, WorkflowStep
from .serializers import WorkflowSerializer, WorkflowCreateSerializer
from utils.executor import WorkflowExecutor

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WorkflowCreateSerializer
        return WorkflowSerializer
    
    @action(detail=True, methods=['post'])
    def trigger(self, request, pk=None):
        """Trigger workflow execution via webhook"""
        workflow = self.get_object()
        
        if not workflow.enabled:
            return Response(
                {'error': 'Workflow is not enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Execute workflow
        executor = WorkflowExecutor(workflow)
        run = executor.execute(request.data)
        
        return Response({
            'run_id': run.run_id,
            'status': run.status,
            'message': 'Workflow execution started'
        })
    
    @action(detail=True, methods=['post'])
    def add_step(self, request, pk=None):
        """Add a step to workflow"""
        workflow = self.get_object()
        
        step_data = request.data
        step_data['workflow'] = workflow.id
        step_data['order'] = workflow.steps.count()
        
        step = WorkflowStep.objects.create(
            workflow=workflow,
            order=step_data['order'],
            action_type=step_data['action_type'],
            app_id=step_data['app_id'],
            config=step_data.get('config', {})
        )
        
        return Response({
            'id': step.id,
            'message': 'Step added successfully'
        })
    
    @action(detail=True, methods=['delete'])
    def delete_step(self, request, pk=None):
        """Delete a workflow step"""
        workflow = self.get_object()
        step_id = request.data.get('step_id')
        
        try:
            step = WorkflowStep.objects.get(id=step_id, workflow=workflow)
            step.delete()
            
            # Reorder remaining steps
            for idx, step in enumerate(workflow.steps.all()):
                step.order = idx
                step.save()
            
            return Response({'message': 'Step deleted successfully'})
        except WorkflowStep.DoesNotExist:
            return Response(
                {'error': 'Step not found'},
                status=status.HTTP_404_NOT_FOUND
            )

