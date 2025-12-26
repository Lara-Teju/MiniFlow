"""
apps/integrations/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ConnectedApp
from .serializers import ConnectedAppSerializer
from .services.sendgrid_service import SendGridService
from .services.slack_service import SlackService
from .services.airtable_service import AirtableService

class ConnectedAppViewSet(viewsets.ModelViewSet):
    queryset = ConnectedApp.objects.all()
    serializer_class = ConnectedAppSerializer
    
    @action(detail=False, methods=['get'])
    def available_apps(self, request):
        """List all available apps with connection status"""
        apps = [
            {
                'name': 'sendgrid',
                'display_name': 'SendGrid',
                'description': 'Send emails',
                'fields': [
                    {'name': 'api_key', 'label': 'API Key', 'type': 'password'},
                    {'name': 'sender_email', 'label': 'Verified Sender Email', 'type': 'email'}
                ],
                'actions': ['send_email']
            },
            {
                'name': 'slack',
                'display_name': 'Slack',
                'description': 'Post messages to channels',
                'fields': [
                    {'name': 'api_key', 'label': 'Bot Token', 'type': 'password'}
                ],
                'actions': ['post_message']
            },
            {
                'name': 'airtable',
                'display_name': 'Airtable',
                'description': 'Read and write records',
                'fields': [
                    {'name': 'api_key', 'label': 'Personal Access Token', 'type': 'password'},
                    {'name': 'base_id', 'label': 'Base ID', 'type': 'text'}
                ],
                'actions': ['get_records', 'create_record']
            }
        ]
        
        # Add connection status
        connected = ConnectedApp.objects.filter(is_connected=True).values_list('app_name', flat=True)
        for app in apps:
            app['is_connected'] = app['name'] in connected
            
        return Response(apps)
    
    @action(detail=False, methods=['post'])
    def connect(self, request):
        """Connect a new app"""
        app_name = request.data.get('app_name')
        api_key = request.data.get('api_key')
        additional_config = request.data.get('additional_config', {})
        
        # Test connection based on app
        if app_name == 'sendgrid':
            sender_email = additional_config.get('sender_email')
            service = SendGridService(api_key, sender_email)
            success, message = service.test_connection()
        elif app_name == 'slack':
            service = SlackService(api_key)
            success, message = service.test_connection()
        elif app_name == 'airtable':
            base_id = additional_config.get('base_id')
            service = AirtableService(api_key, base_id)
            success, message = service.test_connection()
        else:
            return Response({'error': 'Invalid app name'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not success:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save or update connection
        app, created = ConnectedApp.objects.update_or_create(
            app_name=app_name,
            defaults={
                'api_key': api_key,
                'additional_config': additional_config,
                'is_connected': True
            }
        )
        
        serializer = self.get_serializer(app)
        return Response({
            'message': message,
            'app': serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """Disconnect an app"""
        app = self.get_object()
        app.is_connected = False
        app.save()
        return Response({'message': 'App disconnected successfully'})
