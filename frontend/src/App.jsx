// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppsPage from './pages/AppsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import WorkflowBuilder from './pages/WorkflowBuilder';
import RunHistoryPage from './pages/RunHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/workflows/new" element={<WorkflowBuilder />} />
            <Route path="/workflows/:id/edit" element={<WorkflowBuilder />} />
            <Route path="/history" element={<RunHistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;