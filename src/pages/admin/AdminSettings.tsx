import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActivityLogs, useAdminAuthLogs } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Activity, Key, Database } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('activity');
  const [activityPage, setActivityPage] = useState(1);
  const [authPage, setAuthPage] = useState(1);

  const { data: activityLogs, isLoading: activityLoading } = useAdminActivityLogs(activityPage);
  const { data: authLogs, isLoading: authLoading } = useAdminAuthLogs(authPage);

  const { data: dbStats, isLoading: dbStatsLoading } = useQuery({
    queryKey: ['admin-db-stats'],
    queryFn: async () => {
      const tables = [
        'profiles',
        'game_saves',
        'player_stats',
        'error_logs',
        'trade_offers',
        'cat_gifts',
        'weekly_challenges',
        'user_roles',
        'admin_activity_log',
        'auth_attempts_log',
      ];

      const counts = await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true });
          return { table, count: count ?? 0 };
        })
      );

      return counts;
    },
  });

  const getAttemptTypeBadge = (type: string, success: boolean) => {
    if (success) return <Badge variant="default">Success</Badge>;
    switch (type) {
      case 'admin_login_failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'access_denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Activity logs, authentication history, and system information
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Auth Attempts
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Admin Activity Log ({activityLogs?.totalCount ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : activityLogs?.logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No activity logged yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        activityLogs?.logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline">{log.action_type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {log.action_description}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.target_user_id?.slice(0, 8) || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {log.created_at
                                ? format(new Date(log.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {activityLogs && activityLogs.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {activityPage} of {activityLogs.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setActivityPage((p) => Math.min(activityLogs.totalPages, p + 1))
                        }
                        disabled={activityPage === activityLogs.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth Attempts Tab */}
          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Attempts ({authLogs?.totalCount ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : authLogs?.logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No auth attempts logged yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        authLogs?.logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {getAttemptTypeBadge(log.attempt_type, log.success)}
                            </TableCell>
                            <TableCell>{log.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.attempt_type}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">
                              {log.error_message || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {log.created_at
                                ? format(new Date(log.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {authLogs && authLogs.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {authPage} of {authLogs.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuthPage((p) => Math.max(1, p - 1))}
                        disabled={authPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuthPage((p) => Math.min(authLogs.totalPages, p + 1))}
                        disabled={authPage === authLogs.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dbStatsLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))
                    : dbStats?.map((stat) => (
                        <div
                          key={stat.table}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm text-muted-foreground font-medium">
                            {stat.table}
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {stat.count.toLocaleString()}
                          </p>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
