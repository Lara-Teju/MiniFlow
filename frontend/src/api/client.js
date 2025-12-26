// src/api/client.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const appsApi = {
  getAvailableApps: () => client.get('/integrations/apps/available_apps/'),
  connectApp: (data) => client.post('/integrations/apps/connect/', data),
  disconnectApp: (id) => client.post(`/integrations/apps/${id}/disconnect/`),
};

export const workflowsApi = {
  getAll: () => client.get('/workflows/workflows/'),
  getOne: (id) => client.get(`/workflows/workflows/${id}/`),
  create: (data) => client.post('/workflows/workflows/', data),
  update: (id, data) => client.put(`/workflows/workflows/${id}/`, data),
  delete: (id) => client.delete(`/workflows/workflows/${id}/`),
  execute: (id) => client.post(`/workflows/workflows/${id}/execute/`),
  executeMultiple: (id, count) => client.post(`/workflows/workflows/${id}/execute_multiple/`, { count }),
};

export const executionsApi = {
  getAll: (workflowId) => {
    const params = workflowId ? { workflow_id: workflowId } : {};
    return client.get('/workflows/executions/', { params });
  },
};

export const analyticsApi = {
  getDashboardStats: () => client.get('/analytics/dashboard-stats/'),
  getExecutionTrends: (days = 7) => client.get(`/analytics/execution-trends/?days=${days}`),
  getWorkflowPerformance: () => client.get('/analytics/workflow-performance/'),
  getErrorBreakdown: () => client.get('/analytics/error-breakdown/'),
};

export default client;