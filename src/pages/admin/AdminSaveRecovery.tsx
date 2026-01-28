import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Cat,
  AlertTriangle,
  CheckCircle2,
  History,
  FileWarning,
  Image,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';

interface RecoveryResult {
  success: boolean;
  userId: string;
  currentCats: string[];
  searchedNames: string[];
  activityLogReferences: Array<{
    activity_type: string;
    activity_description: string;
    created_at: string;
    metadata: unknown;
  }>;
  errorLogReferences: Array<{
    error_type: string;
    error_message: string;
    created_at: string;
  }>;
  portraitBucketFiles: string[];
  snapshotHistory: Array<{
    snapshot_type: string;
    cat_count: number;
    cat_names: string[];
    day: number;
    created_at: string;
  }>;
  recommendations: string[];
}

interface SyncHealthLog {
  id: string;
  run_at: string;
  saves_checked: number;
  saves_with_issues: number;
  total_issues: number;
  issue_summary: {
    critical: number;
    warning: number;
    info: number;
    by_type: Record<string, number>;
  };
  execution_time_ms: number;
}

export default function AdminSaveRecovery() {
  const [userId, setUserId] = useState('');
  const [catNames, setCatNames] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);

  // Fetch recent sync health logs
  const { data: healthLogs, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['admin-sync-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_health_log')
        .select('*')
        .order('run_at', { ascending: false })
        .limit(24);

      if (error) throw error;
      return (data || []) as unknown as SyncHealthLog[];
    },
  });

  // Recovery mutation
  const recoveryMutation = useMutation({
    mutationFn: async ({ userId, catNames }: { userId: string; catNames: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('recover-lost-cats', {
        body: { userId, catNames },
      });

      if (response.error) throw response.error;
      return response.data as RecoveryResult;
    },
    onSuccess: (data) => {
      setRecoveryResult(data);
      toast.success('Recovery analysis complete');
    },
    onError: (error) => {
      toast.error(`Recovery failed: ${error.message}`);
    },
  });

  // Manual sync health check trigger
  const triggerHealthCheck = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('sync-health-check', {
        body: {},
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Health check completed');
      refetchHealth();
    },
    onError: (error) => {
      toast.error(`Health check failed: ${error.message}`);
    },
  });

  const handleSearch = () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    const names = catNames
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    recoveryMutation.mutate({ userId: userId.trim(), catNames: names });
  };

  const latestHealth = healthLogs?.[0];
  const totalCritical = healthLogs?.reduce((sum, log) => sum + (log.issue_summary?.critical || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Save Recovery & Sync Health</h1>
          <p className="text-muted-foreground">
            Investigate missing cats and monitor data integrity
          </p>
        </div>

        {/* Sync Health Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Last Health Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : latestHealth ? (
                <div>
                  <p className="text-2xl font-bold">{latestHealth.saves_checked} saves</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(latestHealth.run_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No health checks yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Issues (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div>
                  <p className="text-2xl font-bold">
                    {healthLogs?.reduce((sum, log) => sum + log.total_issues, 0) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalCritical} critical
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Manual Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => triggerHealthCheck.mutate()}
                disabled={triggerHealthCheck.isPending}
                size="sm"
              >
                {triggerHealthCheck.isPending ? 'Running...' : 'Run Now'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recovery Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cat Recovery Search
            </CardTitle>
            <CardDescription>
              Search for lost cats by user ID and cat names
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID (UUID)</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="93dcd753-d511-448d-a4ec-db5f991b08a8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catNames">Cat Names (comma-separated, optional)</Label>
                <Input
                  id="catNames"
                  value={catNames}
                  onChange={(e) => setCatNames(e.target.value)}
                  placeholder="Chester, Mittens, Felix"
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={recoveryMutation.isPending}
            >
              {recoveryMutation.isPending ? 'Searching...' : 'Search for Lost Cats'}
            </Button>
          </CardContent>
        </Card>

        {/* Recovery Results */}
        {recoveryResult && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current Cats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cat className="h-5 w-5" />
                  Current Cats ({recoveryResult.currentCats.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recoveryResult.currentCats.map((name, i) => (
                    <Badge key={i} variant="secondary">{name}</Badge>
                  ))}
                  {recoveryResult.currentCats.length === 0 && (
                    <p className="text-muted-foreground">No cats in current save</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recoveryResult.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {rec}
                    </li>
                  ))}
                  {recoveryResult.recommendations.length === 0 && (
                    <p className="text-muted-foreground">No issues detected</p>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Snapshot History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Snapshot History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {recoveryResult.snapshotHistory.length > 0 ? (
                    <div className="space-y-2">
                      {recoveryResult.snapshotHistory.map((snap, i) => (
                        <div key={i} className="p-2 border rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Day {snap.day}</span>
                            <Badge variant="outline">{snap.cat_count} cats</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(snap.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs mt-1 truncate">
                            {snap.cat_names.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No snapshots found</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Error Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-red-500" />
                  Related Errors ({recoveryResult.errorLogReferences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {recoveryResult.errorLogReferences.length > 0 ? (
                    <div className="space-y-2">
                      {recoveryResult.errorLogReferences.map((err, i) => (
                        <div key={i} className="p-2 border rounded text-sm">
                          <Badge variant="destructive" className="text-xs">
                            {err.error_type}
                          </Badge>
                          <p className="text-xs mt-1 truncate">{err.error_message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(err.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No related errors found</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Portrait Files */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Portrait Files ({recoveryResult.portraitBucketFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recoveryResult.portraitBucketFiles.map((file, i) => (
                    <Badge key={i} variant="outline">{file}</Badge>
                  ))}
                  {recoveryResult.portraitBucketFiles.length === 0 && (
                    <p className="text-muted-foreground">No portrait files found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sync Health History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {healthLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : healthLogs && healthLogs.length > 0 ? (
                <div className="space-y-2">
                  {healthLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {log.saves_checked} saves checked
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.run_at).toLocaleString()} • {log.execution_time_ms}ms
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {log.issue_summary?.critical > 0 && (
                          <Badge variant="destructive">
                            {log.issue_summary.critical} critical
                          </Badge>
                        )}
                        {log.issue_summary?.warning > 0 && (
                          <Badge variant="outline" className="text-yellow-600">
                            {log.issue_summary.warning} warnings
                          </Badge>
                        )}
                        {log.total_issues === 0 && (
                          <Badge variant="secondary">All clear</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Health Checks</AlertTitle>
                  <AlertDescription>
                    Run a manual health check or wait for the scheduled cron job.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
