// src/pages/AppsPage.tsx
import { useState, useEffect } from 'react';
import { Link2, Unlink, Key, CheckCircle2, ExternalLink, MessageSquare, Mail, Globe } from 'lucide-react';
import { integrationsAPI } from '@/lib/api';
import type { Integration } from '@/lib/types';
import { APP_DEFINITIONS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof MessageSquare> = {
  MessageSquare,
  Mail,
  Globe,
};

export function AppsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkModal, setLinkModal] = useState<{ open: boolean; app: any }>({ open: false, app: null });
  const [formData, setFormData] = useState({ label: '', apiKey: '', apiSecret: '' });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await integrationsAPI.list();
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setIntegrations(data);
    } catch (error) {
      toast.error('Failed to load integrations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter API key');
      return;
    }

    setTesting(true);
    try {
      const response = await integrationsAPI.testConnection({
        app_type: linkModal.app.id,
        api_key: formData.apiKey,
        api_secret: formData.apiSecret
      });

      if (response.data.success) {
        toast.success('Connection successful!');
      } else {
        toast.error(response.data.error || 'Connection failed');
      }
    } catch (error) {
      toast.error('Failed to test connection');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  const handleLink = async () => {
    if (!formData.label || !formData.apiKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await integrationsAPI.create({
        app_type: linkModal.app.id,
        label: formData.label,
        api_key: formData.apiKey,
        api_secret: formData.apiSecret
      });
      
      toast.success('Integration linked successfully');
      setLinkModal({ open: false, app: null });
      setFormData({ label: '', apiKey: '', apiSecret: '' });
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to link integration');
      console.error(error);
    }
  };

  const handleUnlink = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to unlink this ${integration.app_type} integration?`)) {
      return;
    }

    try {
      await integrationsAPI.unlink(integration.id);
      toast.success('Integration unlinked');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to unlink integration');
      console.error(error);
    }
  };

  const getLinkedIntegration = (appId: string) => 
    integrations.find(i => i.app_type === appId && i.linked);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading apps...</p>
        </div>
      </div>
    );
  }

  const linkedCount = integrations.filter(i => i.linked).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Apps</h2>
          <p className="text-muted-foreground mt-1">
            {linkedCount} of {APP_DEFINITIONS.length} apps connected
          </p>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          Browse Library
        </Button>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {APP_DEFINITIONS.map((app) => {
          const Icon = iconMap[app.icon] || Globe;
          const linkedIntegration = getLinkedIntegration(app.id);

          return (
            <Card 
              key={app.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl text-white", app.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {linkedIntegration && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Linked
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{app.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{app.description}</p>
                  {linkedIntegration && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <Key className="w-3 h-3 inline mr-1" />
                      {linkedIntegration.label}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Available Actions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.actions.map((action) => (
                      <span
                        key={action.id}
                        className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs"
                      >
                        {action.name}
                      </span>
                    ))}
                  </div>
                </div>

                {linkedIntegration ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleUnlink(linkedIntegration)}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Unlink Account
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setLinkModal({ open: true, app })}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Account
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Link Modal */}
      <Dialog open={linkModal.open} onOpenChange={(open) => {
        setLinkModal({ ...linkModal, open });
        if (!open) setFormData({ label: '', apiKey: '', apiSecret: '' });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Link {linkModal.app?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect this app to your workflows
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., personal-account"
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this connection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter API key"
              />
            </div>

            {linkModal.app?.needsSecret && (
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Token *</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  placeholder="Enter API token"
                />
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !formData.apiKey}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkModal({ open: false, app: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!formData.label || !formData.apiKey}
            >
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}