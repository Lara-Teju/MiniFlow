// src/pages/RunHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { executionsApi } from '../api/client';

export default function RunHistoryPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState(null);
  
  useEffect(() => {
    loadExecutions();
  }, []);
  
  const loadExecutions = async () => {
    try {
      const response = await executionsApi.getAll();
      setExecutions(response.data.results || response.data);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };
  
  const getStatusColor = (status) => {
    if (status === 'success') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };
  
  if (loading) {
    return <div className="text-center py-12">Loading execution history...</div>;
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Run History</h1>
        <p className="text-gray-600">View all workflow execution results</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {executions.map(execution => (
              <tr key={execution.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(execution.status)}
                    <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {execution.workflow_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {execution.duration_ms ? `${execution.duration_ms}ms` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(execution.started_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedExecution(execution)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedExecution(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Execution Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Trigger Data:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedExecution.trigger_data, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Action Result:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedExecution.action_result, null, 2)}
                  </pre>
                </div>
                {selectedExecution.error_message && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Error:</h4>
                    <p className="bg-red-50 text-red-700 p-3 rounded text-sm">
                      {selectedExecution.error_message}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}