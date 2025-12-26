"""
config/urls.py
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/integrations/', include('apps.integrations.urls')),
    path('api/workflows/', include('apps.workflows.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]
