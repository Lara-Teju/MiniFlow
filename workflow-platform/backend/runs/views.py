# runs/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkflowRun
from .serializers import WorkflowRunSerializer
from django_filters.rest_framework import DjangoFilterBackend

class WorkflowRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowRun.objects.all().prefetch_related('step_runs')
    serializer_class = WorkflowRunSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'workflow']
    ordering_fields = ['started_at', 'duration_ms']
    ordering = ['-started_at']