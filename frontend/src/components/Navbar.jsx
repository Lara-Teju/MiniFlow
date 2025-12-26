// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Boxes, History, Workflow } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  
  const links = [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/workflows', label: 'Workflows', icon: Workflow },
    { to: '/history', label: 'Run History', icon: History },
    { to: '/apps', label: 'Apps', icon: Boxes },
  ];
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Workflow className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">WorkflowHub</span>
          </div>
          
          <div className="flex space-x-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  location.pathname === to
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}