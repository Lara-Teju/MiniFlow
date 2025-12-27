"""
apps/integrations/admin.py
"""
from django.contrib import admin
from .models import ConnectedApp

@admin.register(ConnectedApp)
class ConnectedAppAdmin(admin.ModelAdmin):
    list_display = ['app_name', 'is_connected', 'connected_at']
    list_filter = ['app_name', 'is_connected']