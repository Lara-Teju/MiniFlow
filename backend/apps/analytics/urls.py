"""
apps/analytics/urls.py
"""
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('execution-trends/', views.execution_trends, name='execution-trends'),
    path('workflow-performance/', views.workflow_performance, name='workflow-performance'),
    path('error-breakdown/', views.error_breakdown, name='error-breakdown'),
]

