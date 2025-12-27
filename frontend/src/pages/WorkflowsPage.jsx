// src/pages/WorkflowsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, RefreshCw } from 'lucide-react';
import { workflowsApi } from '../api/client';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadWorkflows();
  }, []);
  
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await workflowsApi.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setWorkflows(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError('Failed to load workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExecute = async (id) => {
    setExecuting(id);
    try {
      await workflowsApi.execute(id);
      alert('Workflow executed successfully!');
      loadWorkflows();
    } catch (error) {
      alert('Failed to execute workflow');
    } finally {
      setExecuting(null);
    }
  };
  
  const handleExecuteMultiple = async (id) => {
    const count = prompt('How many times to execute?', '20');
    if (!count) return;
    
    setExecuting(id);
    try {
      await workflowsApi.executeMultiple(id, parseInt(count));
      alert(`Executed ${count} times successfully!`);
      loadWorkflows();
    } catch (error) {
      alert('Failed to execute workflow');
    } finally {
      setExecuting(null);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    
    try {
      await workflowsApi.delete(id);
      loadWorkflows();
    } catch (error) {
      alert('Failed to delete workflow');
    }
  };
  
  if (loading) {
    return <div className="text-center py-12">Loading workflows...</div>;
  }
  if (error) {
    return <div className="text-red-600">{error}</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflows</h1>
          <p className="text-gray-600">Manage your automation workflows</p>
        </div>
        <button
          onClick={() => navigate('/workflows/create')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Workflow
        </button>
      </div>
      
      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No workflows yet</p>
          <button
            onClick={() => navigate('/workflows/create')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create your first workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map(workflow => (
            <div key={workflow.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold">{workflow.name}</h3>
              <p className="text-gray-600">{workflow.description}</p>
              
              <div className="flex items-center space-x-4 text-sm mt-4">
                <span className="text-gray-500">
                  {workflow.trigger_app} → {workflow.action_app}
                </span>
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                  {workflow.execution_count} runs
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {workflow.success_rate}% success
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <button
                  onClick={() => handleExecute(workflow.id)}
                  disabled={executing === workflow.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                  title="Execute once"
                >
                  <Play className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleExecuteMultiple(workflow.id)}
                  disabled={executing === workflow.id}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Execute multiple times"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}