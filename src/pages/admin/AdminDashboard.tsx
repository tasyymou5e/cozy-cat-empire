import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { useAdminStats, useAdminLiveActivity, useSyncHealthLogs } from '@/hooks/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Gamepad2,
  Save,
  AlertTriangle,
  Trophy,
  Cat,
  Heart,
  Coins,
  Activity,
  ArrowLeftRight,
  Gift,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  color?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const REFRESH_INTERVALS: Record<string, number | undefined> = {
  off: undefined,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
};

export default function AdminDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<string>('30s');

  const currentInterval = autoRefresh ? REFRESH_INTERVALS[refreshInterval] : undefined;

  const { data: stats, isLoading, dataUpdatedAt: statsUpdatedAt } = useAdminStats(currentInterval);
  const { data: liveActivity, isLoading: liveLoading, dataUpdatedAt } = useAdminLiveActivity();
  const { data: syncHealth, isLoading: syncLoading } = useSyncHealthLogs(1);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--';
  const statsLastUpdated = statsUpdatedAt ? new Date(statsUpdatedAt).toLocaleTimeString() : '--';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the Cat King Admin Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh
              </Label>
            </div>
            {autoRefresh && (
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30s">30s</SelectItem>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              {statsLastUpdated}
            </div>
          </div>
        </div>

        {/* Live Activity Monitor */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg">Live Activity</CardTitle>
                <Badge variant="outline" className="ml-2 text-xs">
                  Last 5 min
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                Updated: {lastUpdated}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Save className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {liveLoading ? (
                      <Skeleton className="h-7 w-8 inline-block" />
                    ) : (
                      (liveActivity?.recentSaves ?? 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Cloud Saves</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {liveLoading ? (
                      <Skeleton className="h-7 w-8 inline-block" />
                    ) : (
                      (liveActivity?.recentErrors ?? 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {liveLoading ? (
                      <Skeleton className="h-7 w-8 inline-block" />
                    ) : (
                      (liveActivity?.recentTrades ?? 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Trades</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Gift className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {liveLoading ? (
                      <Skeleton className="h-7 w-8 inline-block" />
                    ) : (
                      (liveActivity?.recentGifts ?? 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Gifts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Health Status Card - Phase 6 */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Sync Health</CardTitle>
              </div>
              <a
                href="/catking/save-recovery"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                View Details
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {syncLoading ? (
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            ) : syncHealth && syncHealth.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{syncHealth[0].saves_checked}</p>
                  <p className="text-xs text-muted-foreground">Saves Checked</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${syncHealth[0].saves_with_issues > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {syncHealth[0].saves_with_issues}
                  </p>
                  <p className="text-xs text-muted-foreground">With Issues</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last check: {new Date(syncHealth[0].run_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sync health checks yet. Cron job may need scheduling.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats?.userCount ?? 0}
            icon={Users}
            loading={isLoading}
            color="text-blue-500"
          />
          <StatCard
            title="Game Saves"
            value={stats?.gameSaveCount ?? 0}
            icon={Save}
            loading={isLoading}
            color="text-green-500"
          />
          <StatCard
            title="Errors (24h)"
            value={stats?.errorCount24h ?? 0}
            icon={AlertTriangle}
            loading={isLoading}
            color="text-red-500"
          />
          <StatCard
            title="Active Players (24h)"
            value={stats?.activePlayersCount ?? 0}
            icon={Gamepad2}
            loading={isLoading}
            color="text-purple-500"
          />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Show Wins"
            value={stats?.totalShowWins ?? 0}
            icon={Trophy}
            loading={isLoading}
            color="text-yellow-500"
          />
          <StatCard
            title="Total Cats"
            value={stats?.totalCats ?? 0}
            icon={Cat}
            loading={isLoading}
            color="text-orange-500"
          />
          <StatCard
            title="Kittens Bred"
            value={stats?.totalKittens ?? 0}
            icon={Heart}
            loading={isLoading}
            color="text-pink-500"
          />
          <StatCard
            title="Total Economy"
            value={`$${(stats?.totalMoney ?? 0).toLocaleString()}`}
            icon={Coins}
            loading={isLoading}
            color="text-emerald-500"
          />
        </div>

        {/* Activity Feed and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Feed */}
          <ActivityFeed />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <a
                href="/catking/users"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Manage Users
              </a>
              <a
                href="/catking/errors"
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                View Errors
              </a>
              <a
                href="/catking/stats"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                View Statistics
              </a>
              <a
                href="/catking/moderation"
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Moderation Tools
              </a>
              <a
                href="/catking/config"
                className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:bg-accent/80 transition-colors"
              >
                Game Config
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
