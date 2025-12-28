# workflows/models.py
from django.db import models
from django.contrib.auth.models import User
import uuid

class Workflow(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_runs = models.IntegerField(default=0)
    last_run = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"wf_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class WorkflowStep(models.Model):
    ACTION_TYPES = [
        ('slack_send_message', 'Slack: Send Message'),
        ('notion_create_page', 'Notion: Create Page'),
        ('notion_update_page', 'Notion: Update Page'),
        ('trello_create_card', 'Trello: Create Card'),
        ('trello_move_card', 'Trello: Move Card'),
        ('gcal_create_event', 'Google Calendar: Create Event'),
        ('gcal_list_events', 'Google Calendar: List Events'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    workflow = models.ForeignKey(Workflow, related_name='steps', on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    app_id = models.CharField(max_length=50)
    config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"step_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.workflow.name} - Step {self.order}"
