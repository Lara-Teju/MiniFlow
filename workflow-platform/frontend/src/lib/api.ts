// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Workflows API
export const workflowsAPI = {
  list: () => api.get('/workflows/'),
  get: (id: string) => api.get(`/workflows/${id}/`),
  create: (data: any) => api.post('/workflows/', data),
  update: (id: string, data: any) => api.patch(`/workflows/${id}/`, data),
  delete: (id: string) => api.delete(`/workflows/${id}/`),
  trigger: (id: string, payload: any) => api.post(`/webhooks/${id}/trigger`, payload),
  addStep: (id: string, step: any) => api.post(`/workflows/${id}/add_step/`, step),
  deleteStep: (id: string, stepId: string) => 
    api.delete(`/workflows/${id}/delete_step/`, { data: { step_id: stepId } }),
};

// Integrations API
export const integrationsAPI = {
  list: () => api.get('/integrations/'),
  get: (id: string) => api.get(`/integrations/${id}/`),
  create: (data: any) => api.post('/integrations/', data),
  testConnection: (data: any) => api.post('/integrations/test_connection/', data),
  unlink: (id: string) => api.post(`/integrations/${id}/unlink/`),
};

// Runs API
export const runsAPI = {
  list: (params?: any) => api.get('/runs/', { params }),
  get: (id: string) => api.get(`/runs/${id}/`),
};

// Analytics API
export const analyticsAPI = {
  get: (days: number = 7) => api.get('/analytics/', { params: { days } }),
};
