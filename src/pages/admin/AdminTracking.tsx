import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog } from '@/hooks/admin';
import { BarChart3, Facebook, Save, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

interface TrackingConfig {
  ga4_enabled: boolean;
  ga4_measurement_id: string;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
}

const DEFAULT_CONFIG: TrackingConfig = {
  ga4_enabled: false,
  ga4_measurement_id: '',
  meta_pixel_enabled: false,
  meta_pixel_id: '',
};

export default function AdminTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();
  const [config, setConfig] = useState<TrackingConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['tracking-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_config')
        .select('key, value')
        .eq('category', 'tracking');
      if (error) throw error;
      
      const result: TrackingConfig = { ...DEFAULT_CONFIG };
      for (const row of data || []) {
        if (row.key === 'ga4_measurement_id') result.ga4_measurement_id = String(row.value ?? '').replace(/^"|"$/g, '');
        if (row.key === 'ga4_enabled') result.ga4_enabled = row.value === true;
        if (row.key === 'meta_pixel_id') result.meta_pixel_id = String(row.value ?? '').replace(/^"|"$/g, '');
        if (row.key === 'meta_pixel_enabled') result.meta_pixel_enabled = row.value === true;
      }
      return result;
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
      setHasChanges(false);
    }
  }, [savedConfig]);

  const updateField = <K extends keyof TrackingConfig>(key: K, value: TrackingConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (newConfig: TrackingConfig) => {
      const entries = [
        { key: 'ga4_measurement_id', value: newConfig.ga4_measurement_id, description: 'Google Analytics 4 Measurement ID (G-XXXXXXXX)' },
        { key: 'ga4_enabled', value: newConfig.ga4_enabled, description: 'Whether GA4 tracking is active' },
        { key: 'meta_pixel_id', value: newConfig.meta_pixel_id, description: 'Meta (Facebook) Pixel ID' },
        { key: 'meta_pixel_enabled', value: newConfig.meta_pixel_enabled, description: 'Whether Meta Pixel tracking is active' },
      ];

      for (const entry of entries) {
        const { error } = await supabase
          .from('game_config')
          .upsert(
            { key: entry.key, value: entry.value as any, category: 'tracking', description: entry.description },
            { onConflict: 'key' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-config'] });
      setHasChanges(false);
      toast({ title: 'Tracking config saved', description: 'Changes will take effect on next page load.' });
      logActivity({ actionType: 'config_update', actionDescription: 'Updated tracking/analytics configuration', targetTable: 'game_config' });
    },
    onError: (err: any) => {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    },
  });

  const ga4Valid = /^G-[A-Z0-9]+$/.test(config.ga4_measurement_id);
  const pixelValid = /^\d{10,20}$/.test(config.meta_pixel_id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ad Tracking & Analytics</h1>
            <p className="text-muted-foreground">Configure Google Analytics 4 and Meta Pixel for ad campaign measurement.</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate(config)}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        {/* GA4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Google Analytics 4</CardTitle>
                <CardDescription>Track pageviews, events, and conversions with GA4.</CardDescription>
              </div>
              <Switch
                checked={config.ga4_enabled}
                onCheckedChange={(v) => updateField('ga4_enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga4-id">Measurement ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ga4-id"
                  placeholder="G-XXXXXXXXXX"
                  value={config.ga4_measurement_id}
                  onChange={(e) => updateField('ga4_measurement_id', e.target.value.trim())}
                  className="max-w-xs font-mono"
                />
                {config.ga4_measurement_id && (
                  ga4Valid
                    ? <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</Badge>
                    : <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="h-3 w-3 mr-1" /> Invalid format</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Find this in{' '}
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
                  Google Analytics <ExternalLink className="h-3 w-3" />
                </a>
                {' '}→ Admin → Data Streams → Web → Measurement ID
              </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Events tracked automatically:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Page views (all routes)</li>
                <li>Signup & login conversions</li>
                <li>Key game engagement events</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Meta Pixel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/10">
                <Facebook className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Meta Pixel (Facebook)</CardTitle>
                <CardDescription>Track conversions and build audiences for Facebook/Instagram ads.</CardDescription>
              </div>
              <Switch
                checked={config.meta_pixel_enabled}
                onCheckedChange={(v) => updateField('meta_pixel_enabled', v)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixel-id">Pixel ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pixel-id"
                  placeholder="123456789012345"
                  value={config.meta_pixel_id}
                  onChange={(e) => updateField('meta_pixel_id', e.target.value.trim())}
                  className="max-w-xs font-mono"
                />
                {config.meta_pixel_id && (
                  pixelValid
                    ? <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</Badge>
                    : <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="h-3 w-3 mr-1" /> Invalid format</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Find this in{' '}
                <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
                  Meta Events Manager <ExternalLink className="h-3 w-3" />
                </a>
                {' '}→ Data Sources → Your Pixel → Pixel ID
              </p>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Events tracked automatically:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>PageView (all routes)</li>
                <li>CompleteRegistration (signup)</li>
                <li>Lead (login)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
