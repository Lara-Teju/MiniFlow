# integrations/admin.py
from django.contrib import admin
from .models import Integration

@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'app_type', 'label', 'linked', 'created_at']
    list_filter = ['app_type', 'linked']
    search_fields = ['label']
