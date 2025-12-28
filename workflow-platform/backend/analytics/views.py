# analytics/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import AnalyticsService

class AnalyticsView(APIView):
    def get(self, request):
        """Get complete analytics data"""
        days = int(request.query_params.get('days', 7))
        
        service = AnalyticsService()
        
        data = {
            **service.get_overview_stats(days),
            'timeSeries': service.get_time_series(days),
            'errors': service.get_error_breakdown(days),
            'workflows': service.get_workflow_performance(days),
            'steps': service.get_step_diagnostics(days),
            'hosts': service.get_host_health(days)
        }
        
        return Response(data)