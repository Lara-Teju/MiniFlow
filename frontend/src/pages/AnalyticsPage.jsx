// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Activity, CheckCircle, Clock } from 'lucide-react';
import { analyticsApi } from '../api/client';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);
  
  const loadAnalytics = async () => {
    try {
      const [statsRes, trendsRes, perfRes, errorsRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getExecutionTrends(timeRange),
        analyticsApi.getWorkflowPerformance(),
        analyticsApi.getErrorBreakdown()
      ]);
      
      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setPerformance(perfRes.data);
      setErrors(errorsRes.data);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }
  
  const statusData = stats ? [
    { name: 'Success', value: Math.round(stats.success_rate) },
    { name: 'Failed', value: 100 - Math.round(stats.success_rate) }
  ] : [];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your workflow performance</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={e => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Workflows</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.total_workflows || 0}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Executions</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.total_executions || 0}</div>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.recent_executions_24h || 0} in last 24h
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Success Rate</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.success_rate || 0}%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Duration</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.avg_duration_ms ? `${Math.round(stats.avg_duration_ms)}ms` : '0ms'}
          </div>
        </div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Execution Trends */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="success" stroke="#10b981" name="Success" strokeWidth={2} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Success Rate Pie */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Success Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Workflow Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="success_count" fill="#10b981" name="Success" />
              <Bar dataKey="failed_count" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Average Duration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Duration by Workflow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="avg_duration_ms" fill="#3b82f6" name="Duration (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Workflow Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Workflow Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Workflow</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Integration</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Total Runs</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Success Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((wf, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{wf.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {wf.trigger_app} → {wf.action_app}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{wf.total_runs}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={`px-2 py-1 rounded ${
                      wf.success_rate >= 90 ? 'bg-green-100 text-green-800' :
                      wf.success_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {wf.success_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{wf.avg_duration_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Error Breakdown */}
      {errors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
          <div className="space-y-3">
            {errors.map((error, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                <span className="text-sm text-red-800 flex-1">{error.error}</span>
                <span className="text-sm font-medium text-red-900 ml-4">{error.count} occurrences</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}