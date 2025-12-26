// src/components/AppCard.jsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react';
import ConnectAppModal from './ConnectAppModal';

export default function AppCard({ app, onConnect, onDisconnect }) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{app.display_name}</h3>
              {app.is_connected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{app.description}</p>
            <div className="flex flex-wrap gap-2">
              {app.actions.map(action => (
                <span key={action} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-2">
          {app.is_connected ? (
            <button
              onClick={() => onDisconnect(app.name)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>
      
      {showModal && (
        <ConnectAppModal
          app={app}
          onClose={() => setShowModal(false)}
          onConnect={onConnect}
        />
      )}
    </>
  );
}
