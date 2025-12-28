# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from workflows.views import WorkflowViewSet
from integrations.views import IntegrationViewSet
from runs.views import WorkflowRunViewSet

router = DefaultRouter()
router.register(r'workflows', WorkflowViewSet, basename='workflow')
router.register(r'integrations', IntegrationViewSet, basename='integration')
router.register(r'runs', WorkflowRunViewSet, basename='run')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/analytics/', include('analytics.urls')),
    path('api/webhooks/<str:pk>/trigger', WorkflowViewSet.as_view({'post': 'trigger'}), name='webhook-trigger'),
]

