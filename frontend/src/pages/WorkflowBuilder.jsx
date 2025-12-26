// src/pages/WorkflowBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { workflowsApi, appsApi } from '../api/client';

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    trigger_app: '',
    trigger_action: '',
    trigger_config: {},
    action_app: '',
    action_type: '',
    action_config: {}
  });
  
  useEffect(() => {
    loadApps();
  }, []);
  
  const loadApps = async () => {
    const response = await appsApi.getAvailableApps();
    const connectedApps = response.data.filter(app => app.is_connected);
    setApps(connectedApps);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await workflowsApi.create(workflow);
      navigate('/workflows');
    } catch (error) {
      alert('Failed to create workflow');
    }
  };
  
  const getTriggerActions = () => {
    const app = apps.find(a => a.name === workflow.trigger_app);
    if (!app) return [];
    
    if (app.name === 'airtable') {
      return [
        { value: 'get_records', label: 'New Record' }
      ];
    }
    return [];
  };
  
  const getActionTypes = () => {
    const app = apps.find(a => a.name === workflow.action_app);
    if (!app) return [];
    
    if (app.name === 'sendgrid') {
      return [{ value: 'send_email', label: 'Send Email' }];
    } else if (app.name === 'slack') {
      return [{ value: 'post_message', label: 'Post Message' }];
    } else if (app.name === 'airtable') {
      return [
        { value: 'get_records', label: 'Get Records' },
        { value: 'create_record', label: 'Create Record' }
      ];
    }
    return [];
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Workflow</h1>
        <p className="text-gray-600">Set up a new automation workflow</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name *
              </label>
              <input
                type="text"
                required
                value={workflow.name}
                onChange={e => setWorkflow({ ...workflow, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New Airtable Record to Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={workflow.description}
                onChange={e => setWorkflow({ ...workflow, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="What does this workflow do?"
              />
            </div>
          </div>
        </div>
        
        {/* Trigger */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Trigger (When this happens...)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App *
              </label>
              <select
                required
                value={workflow.trigger_app}
                onChange={e => setWorkflow({ 
                  ...workflow, 
                  trigger_app: e.target.value,
                  trigger_action: '',
                  trigger_config: {}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an app</option>
                {apps.map(app => (
                  <option key={app.name} value={app.name}>{app.display_name}</option>
                ))}
              </select>
            </div>
            
            {workflow.trigger_app && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Event *
                  </label>
                  <select
                    required
                    value={workflow.trigger_action}
                    onChange={e => setWorkflow({ ...workflow, trigger_action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a trigger</option>
                    {getTriggerActions().map(action => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                </div>
                
                {workflow.trigger_app === 'airtable' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={workflow.trigger_config.table_name || ''}
                      onChange={e => setWorkflow({ 
                        ...workflow, 
                        trigger_config: { ...workflow.trigger_config, table_name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Contacts"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* Action */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Action (Do this...)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App *
              </label>
              <select
                required
                value={workflow.action_app}
                onChange={e => setWorkflow({ 
                  ...workflow, 
                  action_app: e.target.value,
                  action_type: '',
                  action_config: {}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an app</option>
                {apps.map(app => (
                  <option key={app.name} value={app.name}>{app.display_name}</option>
                ))}
              </select>
            </div>
            
            {workflow.action_app && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action *
                  </label>
                  <select
                    required
                    value={workflow.action_type}
                    onChange={e => setWorkflow({ ...workflow, action_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an action</option>
                    {getActionTypes().map(action => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                </div>
                
                {workflow.action_app === 'sendgrid' && workflow.action_type === 'send_email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={workflow.action_config.subject || ''}
                        onChange={e => setWorkflow({ 
                          ...workflow, 
                          action_config: { ...workflow.action_config, subject: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body *
                      </label>
                      <textarea
                        required
                        value={workflow.action_config.body || ''}
                        onChange={e => setWorkflow({ 
                          ...workflow, 
                          action_config: { ...workflow.action_config, body: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        placeholder="Email body (HTML supported)"
                      />
                    </div>
                  </>
                )}
                
                {workflow.action_app === 'slack' && workflow.action_type === 'post_message' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Channel *
                      </label>
                      <input
                        type="text"
                        required
                        value={workflow.action_config.channel || ''}
                        onChange={e => setWorkflow({ 
                          ...workflow, 
                          action_config: { ...workflow.action_config, channel: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., general"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        required
                        value={workflow.action_config.message || ''}
                        onChange={e => setWorkflow({ 
                          ...workflow, 
                          action_config: { ...workflow.action_config, message: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Message to post"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Submit */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/workflows')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Workflow
          </button>
        </div>
      </form>
    </div>
  );
}