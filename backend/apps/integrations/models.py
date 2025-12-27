"""
apps/integrations/models.py
"""
from django.db import models
from django.utils import timezone

class ConnectedApp(models.Model):
    APP_CHOICES = [
        ('sendgrid', 'SendGrid'),
        ('slack', 'Slack'),
        ('airtable', 'Airtable'),
    ]
    
    app_name = models.CharField(max_length=50, choices=APP_CHOICES, unique=True)
    api_key = models.CharField(max_length=500)
    additional_config = models.JSONField(default=dict, blank=True)  # For base_id, sender_email, etc.
    is_connected = models.BooleanField(default=True)
    connected_at = models.DateTimeField(default=timezone.now)
    last_verified = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'connected_apps'
        
    def __str__(self):
        return f"{self.get_app_name_display()} - {'Connected' if self.is_connected else 'Disconnected'}"
