# integrations/models.py
from django.db import models
from django.contrib.auth.models import User

class Integration(models.Model):
    APP_TYPES = [
        ('slack', 'Slack'),
        ('notion', 'Notion'),
        ('trello', 'Trello'),
        ('google_calendar', 'Google Calendar'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    app_type = models.CharField(max_length=50, choices=APP_TYPES)
    label = models.CharField(max_length=255)
    api_key = models.CharField(max_length=500)
    api_secret = models.CharField(max_length=500, blank=True)  # For Trello
    linked = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = f"int_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.app_type} - {self.label}"
    
    class Meta:
        unique_together = ['app_type', 'label']

