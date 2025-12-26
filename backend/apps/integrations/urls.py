"""
apps/integrations/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConnectedAppViewSet

router = DefaultRouter()
router.register(r'apps', ConnectedAppViewSet, basename='connected-app')

urlpatterns = [
    path('', include(router.urls)),
]
