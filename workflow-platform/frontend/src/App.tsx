// ============================================
// Updated src/App.tsx with ErrorBoundary
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sidebar } from '@/components/layout/Sidebar';
import { WorkflowsPage } from '@/pages/WorkflowsPage';
import { AppsPage } from '@/pages/AppsPage';
import { RunsPage } from '@/pages/RunsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<WorkflowsPage />} />
              <Route path="/apps" element={<AppsPage />} />
              <Route path="/runs" element={<RunsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </div>
        </div>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          toastOptions={{
            style: {
              background: 'white',
            },
            className: 'border border-gray-200',
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
