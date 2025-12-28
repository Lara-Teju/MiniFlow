# integrations/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Integration
from .serializers import IntegrationSerializer, IntegrationCreateSerializer
from .services.slack import SlackIntegration
from .services.notion import NotionIntegration
from .services.trello import TrelloIntegration
from .services.google_calendar import GoogleCalendarIntegration

class IntegrationViewSet(viewsets.ModelViewSet):
    queryset = Integration.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IntegrationCreateSerializer
        return IntegrationSerializer
    
    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        """Test integration connection"""
        app_type = request.data.get('app_type')
        api_key = request.data.get('api_key')
        api_secret = request.data.get('api_secret')
        
        service_map = {
            'slack': SlackIntegration,
            'notion': NotionIntegration,
            'trello': TrelloIntegration,
            'google_calendar': GoogleCalendarIntegration,
        }
        
        service_class = service_map.get(app_type)
        if not service_class:
            return Response(
                {'error': 'Unknown app type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if app_type == 'trello':
                service = service_class(api_key, api_secret)
            else:
                service = service_class(api_key)
            
            result = service.test_connection()
            return Response(result)
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def unlink(self, request, pk=None):
        """Unlink integration"""
        integration = self.get_object()
        integration.linked = False
        integration.save()
        
        return Response({'message': 'Integration unlinked successfully'})
