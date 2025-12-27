"""
apps/integrations/serializers.py
"""
from rest_framework import serializers
from .models import ConnectedApp

class ConnectedAppSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectedApp
        fields = ['id', 'app_name', 'api_key', 'additional_config', 'is_connected', 'connected_at']
        extra_kwargs = {
            'api_key': {'write_only': True}  # Don't expose in GET requests
        }