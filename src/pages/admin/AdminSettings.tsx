import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useAdminActivityLogs,
  useAdminAuthLogs,
  useAdminPlayerActivityLogs,
  useAdminStorageStats,
  useAdminAllTableStats,
} from '@/hooks/admin';
import { ExportButton } from '@/components/admin/ExportButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Key,
  Database,
  Users,
  HardDrive,
  ChevronDown,
  RefreshCw,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

// Activity types for player activity log filter
const ACTIVITY_TYPES = [
  'login',
  'logout',
  'trade_created',
  'trade_completed',
  'gift_sent',
  'gift_received',
  'cat_bred',
  'show_win',
  'challenge_completed',
  'purchase',
];

// Category labels and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  core: { label: 'Core Tables', color: 'bg-blue-500/10 text-blue-600' },
  social: { label: 'Social Features', color: 'bg-green-500/10 text-green-600' },
  challenges: { label: 'Challenges & Objectives', color: 'bg-purple-500/10 text-purple-600' },
  progression: { label: 'Player Progression', color: 'bg-amber-500/10 text-amber-600' },
  leaderboards: { label: 'Leaderboards & Rewards', color: 'bg-rose-500/10 text-rose-600' },
  logging: { label: 'Logging & Analytics', color: 'bg-slate-500/10 text-slate-600' },
  content: { label: 'Content Management', color: 'bg-cyan-500/10 text-cyan-600' },
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('activity');
  const [activityPage, setActivityPage] = useState(1);
  const [authPage, setAuthPage] = useState(1);
  const [playerActivityPage, setPlayerActivityPage] = useState(1);
  const [playerActivityFilter, setPlayerActivityFilter] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<string[]>(['core', 'logging']);

  const { data: activityLogs, isLoading: activityLoading } = useAdminActivityLogs(activityPage);
  const { data: authLogs, isLoading: authLoading } = useAdminAuthLogs(authPage);
  const { data: playerActivityLogs, isLoading: playerActivityLoading } = useAdminPlayerActivityLogs(
    {
      activityType: playerActivityFilter || undefined,
      page: playerActivityPage,
    }
  );
  const { data: storageStats, isLoading: storageLoading } = useAdminStorageStats();
  const {
    data: tableStats,
    isLoading: tableStatsLoading,
    refetch: refetchTables,
  } = useAdminAllTableStats();

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleRefreshTables = () => {
    refetchTables();
    queryClient.invalidateQueries({ queryKey: ['admin-storage-stats'] });
  };

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

  const getActivityTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      login: 'bg-green-500/10 text-green-600',
      logout: 'bg-slate-500/10 text-slate-600',
      trade_created: 'bg-blue-500/10 text-blue-600',
      trade_completed: 'bg-blue-600/10 text-blue-700',
      gift_sent: 'bg-pink-500/10 text-pink-600',
      gift_received: 'bg-pink-600/10 text-pink-700',
      cat_bred: 'bg-amber-500/10 text-amber-600',
      show_win: 'bg-yellow-500/10 text-yellow-600',
      challenge_completed: 'bg-purple-500/10 text-purple-600',
      purchase: 'bg-emerald-500/10 text-emerald-600',
    };
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Activity logs, authentication history, player activity, and system information
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Auth Attempts
            </TabsTrigger>
            <TabsTrigger value="player-activity" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Player Activity
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Admin Activity Log ({activityLogs?.totalCount ?? 0})</CardTitle>
                  <CardDescription>Actions performed by administrators</CardDescription>
                </div>
                <ExportButton
                  data={activityLogs?.logs || []}
                  filename="admin-activity-log"
                  columns={['action_type', 'action_description', 'target_user_id', 'created_at']}
                />
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
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Authentication Attempts ({authLogs?.totalCount ?? 0})</CardTitle>
                  <CardDescription>Login attempts and access events</CardDescription>
                </div>
                <ExportButton
                  data={authLogs?.logs || []}
                  filename="auth-attempts-log"
                  columns={['email', 'attempt_type', 'success', 'error_message', 'created_at']}
                />
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

          {/* Player Activity Tab - NEW */}
          <TabsContent value="player-activity">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-4">
                <div>
                  <CardTitle>Player Activity Log ({playerActivityLogs?.totalCount ?? 0})</CardTitle>
                  <CardDescription>In-game player actions and events</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={playerActivityFilter}
                    onValueChange={(value) => {
                      setPlayerActivityFilter(value === 'all' ? '' : value);
                      setPlayerActivityPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ExportButton
                    data={playerActivityLogs?.logs || []}
                    filename="player-activity-log"
                    columns={[
                      'activity_type',
                      'activity_description',
                      'user_id',
                      'created_at',
                      'metadata',
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerActivityLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : playerActivityLogs?.logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No player activity logged yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        playerActivityLogs?.logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>{getActivityTypeBadge(log.activity_type)}</TableCell>
                            <TableCell className="max-w-md truncate">
                              {log.activity_description}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.user_id?.slice(0, 8) || '-'}
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

                {playerActivityLogs && playerActivityLogs.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {playerActivityPage} of {playerActivityLogs.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlayerActivityPage((p) => Math.max(1, p - 1))}
                        disabled={playerActivityPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPlayerActivityPage((p) =>
                            Math.min(playerActivityLogs.totalPages, p + 1)
                          )
                        }
                        disabled={playerActivityPage === playerActivityLogs.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab - EXPANDED */}
          <TabsContent value="database" className="space-y-6">
            {/* Storage Buckets Section */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Storage Buckets</CardTitle>
                    <CardDescription>File storage usage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {storageLoading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))
                    : storageStats?.map((stat) => (
                        <div
                          key={stat.bucket}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3"
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Image className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">
                              {stat.bucket}
                            </p>
                            <p className="text-2xl font-bold">
                              {stat.status === 'ok' ? stat.count.toLocaleString() : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">files</p>
                          </div>
                          {stat.status === 'error' && (
                            <Badge variant="destructive" className="ml-auto">
                              Error
                            </Badge>
                          )}
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Tables Section */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Database Statistics</CardTitle>
                    <CardDescription>
                      {tableStats
                        ? `${tableStats.totalTables} tables • ${tableStats.totalRows.toLocaleString()} total rows`
                        : 'Loading...'}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTables}
                  disabled={tableStatsLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${tableStatsLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {tableStatsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <Skeleton key={j} className="h-20" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  Object.entries(tableStats?.grouped || {}).map(([category, tables]) => (
                    <Collapsible
                      key={category}
                      open={openCategories.includes(category)}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                          <div className="flex items-center gap-2">
                            <Badge className={CATEGORY_CONFIG[category]?.color || ''}>
                              {CATEGORY_CONFIG[category]?.label || category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {tables.length} tables •{' '}
                              {tables.reduce((sum, t) => sum + (t.count ?? 0), 0).toLocaleString()}{' '}
                              rows
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${openCategories.includes(category) ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
                          {tables.map((stat) => (
                            <div
                              key={stat.table}
                              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <p
                                className="text-sm text-muted-foreground font-medium truncate"
                                title={stat.table}
                              >
                                {stat.table}
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {stat.status === 'ok' && stat.count !== null
                                  ? stat.count.toLocaleString()
                                  : 'N/A'}
                              </p>
                              {stat.status === 'error' && (
                                <Badge variant="destructive" className="mt-1">
                                  Query Error
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
