# integrations/serializers.py
from rest_framework import serializers
from .models import Integration

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ['id', 'app_type', 'label', 'linked', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class IntegrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ['app_type', 'label', 'api_key', 'api_secret']
    
    def create(self, validated_data):
        return Integration.objects.create(**validated_data)
