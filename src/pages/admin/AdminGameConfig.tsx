import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog } from '@/hooks/admin';
import {
  Settings,
  ToggleLeft,
  DollarSign,
  Gamepad2,
  AlertTriangle,
  Save,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface GameConfig {
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  system: <AlertTriangle className="h-4 w-4" />,
  features: <ToggleLeft className="h-4 w-4" />,
  rewards: <DollarSign className="h-4 w-4" />,
  limits: <Sliders className="h-4 w-4" />,
  economy: <DollarSign className="h-4 w-4" />,
  gameplay: <Gamepad2 className="h-4 w-4" />,
  general: <Settings className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  system: 'bg-destructive/10 text-destructive',
  features: 'bg-primary/10 text-primary',
  rewards: 'bg-yellow-500/10 text-yellow-600',
  limits: 'bg-orange-500/10 text-orange-600',
  economy: 'bg-green-500/10 text-green-600',
  gameplay: 'bg-blue-500/10 text-blue-600',
  general: 'bg-muted text-muted-foreground',
};

export default function AdminGameConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin-game-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_config')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as GameConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { error } = await supabase
        .from('game_config')
        .update({ 
          value, 
          updated_at: new Date().toISOString(),
        })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-game-config'] });
      logActivity({
        actionType: 'config_update',
        actionDescription: `Updated game config: ${variables.key}`,
        targetTable: 'game_config',
      });
      toast({ title: 'Config updated', description: `${variables.key} has been updated.` });
      setEditingKey(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (config: GameConfig) => {
    setEditingKey(config.key);
    setEditValue(typeof config.value === 'object' ? JSON.stringify(config.value, null, 2) : String(config.value));
  };

  const handleSave = (key: string) => {
    try {
      const parsedValue = JSON.parse(editValue);
      updateMutation.mutate({ key, value: parsedValue as Json });
    } catch {
      // If not valid JSON, save as string (for simple values)
      updateMutation.mutate({ key, value: editValue as Json });
    }
  };

  const handleToggleFeature = (featureKey: string, currentValue: boolean) => {
    const featuresConfig = configs?.find(c => c.key === 'features');
    if (!featuresConfig) return;
    
    const features = featuresConfig.value as Record<string, boolean>;
    updateMutation.mutate({
      key: 'features',
      value: { ...features, [featureKey]: !currentValue } as Json,
    });
  };

  const handleToggleMaintenance = () => {
    const maintenanceConfig = configs?.find(c => c.key === 'maintenance_mode');
    if (!maintenanceConfig) return;
    
    const maintenance = maintenanceConfig.value as { enabled: boolean; message: string };
    updateMutation.mutate({
      key: 'maintenance_mode',
      value: { ...maintenance, enabled: !maintenance.enabled } as Json,
    });
  };

  // Group configs by category
  const groupedConfigs = configs?.reduce((acc, config) => {
    const category = config.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(config);
    return acc;
  }, {} as Record<string, GameConfig[]>) || {};

  const maintenanceConfig = configs?.find(c => c.key === 'maintenance_mode')?.value as { enabled: boolean; message: string } | undefined;
  const featuresConfig = configs?.find(c => c.key === 'features')?.value as Record<string, boolean> | undefined;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Game Configuration
          </h1>
          <p className="text-muted-foreground">Manage game settings, feature flags, and system configuration.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Maintenance Mode Card - Always visible at top */}
            <Card className={maintenanceConfig?.enabled ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${maintenanceConfig?.enabled ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <CardTitle>Maintenance Mode</CardTitle>
                  </div>
                  <Switch
                    checked={maintenanceConfig?.enabled || false}
                    onCheckedChange={handleToggleMaintenance}
                  />
                </div>
                <CardDescription>
                  When enabled, users will see a maintenance message instead of the game.
                </CardDescription>
              </CardHeader>
              {maintenanceConfig?.enabled && (
                <CardContent>
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Maintenance mode is currently ENABLED
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Message: {maintenanceConfig.message}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Feature Flags Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5 text-primary" />
                  <CardTitle>Feature Flags</CardTitle>
                </div>
                <CardDescription>Enable or disable specific game features.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuresConfig && Object.entries(featuresConfig).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <span className="text-sm font-medium capitalize">
                        {feature.replace(/_/g, ' ')}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => handleToggleFeature(feature, enabled)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Other Configs by Category */}
            <Accordion type="multiple" defaultValue={Object.keys(groupedConfigs)} className="space-y-2">
              {Object.entries(groupedConfigs)
                .filter(([category]) => category !== 'system' && category !== 'features')
                .map(([category, categoryConfigs]) => (
                  <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        {categoryIcons[category] || categoryIcons.general}
                        <span className="capitalize font-semibold">{category}</span>
                        <Badge variant="secondary" className={categoryColors[category]}>
                          {categoryConfigs.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 py-2">
                        {categoryConfigs.map((config) => (
                          <div key={config.key} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{config.key}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {config.description || 'No description'}
                                </p>
                              </div>
                              {editingKey === config.key ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingKey(null)}
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(config.key)}
                                    disabled={updateMutation.isPending}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(config)}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                            <div className="mt-3">
                              {editingKey === config.key ? (
                                typeof config.value === 'object' ? (
                                  <Textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="font-mono text-xs"
                                    rows={5}
                                  />
                                ) : (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="font-mono"
                                  />
                                )
                              ) : (
                                <code className="text-xs bg-muted p-2 rounded block overflow-auto">
                                  {typeof config.value === 'object'
                                    ? JSON.stringify(config.value, null, 2)
                                    : String(config.value)}
                                </code>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Last updated: {new Date(config.updated_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
