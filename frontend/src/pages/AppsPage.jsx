// src/pages/AppsPage.jsx
import React, { useState, useEffect } from 'react';
import { appsApi } from '../api/client';
import AppCard from '../components/AppCard';

export default function AppsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadApps();
  }, []);
  
  const loadApps = async () => {
    try {
      const response = await appsApi.getAvailableApps();
      setApps(response.data);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async (data) => {
    await appsApi.connectApp(data);
    loadApps();
  };
  
  const handleDisconnect = async (appName) => {
    const app = apps.find(a => a.name === appName);
    if (!app) return;
    
    const connected = await appsApi.getAvailableApps();
    const connectedApp = connected.data.find(a => a.name === appName);
    if (connectedApp?.id) {
      await appsApi.disconnectApp(connectedApp.id);
      loadApps();
    }
  };
  
  if (loading) {
    return <div className="text-center py-12">Loading apps...</div>;
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Apps</h1>
        <p className="text-gray-600">Connect external services to build workflows</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <AppCard
            key={app.name}
            app={app}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>
    </div>
  );
}
