"""
apps/workflows/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Workflow, WorkflowExecution
from .serializers import WorkflowSerializer, WorkflowExecutionSerializer
from .executor import WorkflowExecutor

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Manually trigger a workflow"""
        workflow = self.get_object()
        executor = WorkflowExecutor()
        execution = executor.execute_workflow(workflow)
        serializer = WorkflowExecutionSerializer(execution)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def execute_multiple(self, request, pk=None):
        """Execute workflow multiple times for testing"""
        workflow = self.get_object()
        count = request.data.get('count', 10)
        
        executor = WorkflowExecutor()
        executions = []
        for i in range(count):
            execution = executor.execute_workflow(workflow, test_mode=True, test_index=i)
            executions.append(execution)
        
        serializer = WorkflowExecutionSerializer(executions, many=True)
        return Response({
            'message': f'Executed {count} times',
            'executions': serializer.data
        })

class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecution.objects.all()
    serializer_class = WorkflowExecutionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        workflow_id = self.request.query_params.get('workflow_id')
        if workflow_id:
            queryset = queryset.filter(workflow_id=workflow_id)
        return queryset