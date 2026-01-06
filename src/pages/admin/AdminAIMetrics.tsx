import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAIStats, useAdminAILogs } from '@/hooks/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/admin/ExportButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

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
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
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

const statusColors: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  rate_limited: 'bg-yellow-500',
  credits_depleted: 'bg-orange-500',
};

const statusBadgeVariants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  success: 'default',
  error: 'destructive',
  rate_limited: 'secondary',
  credits_depleted: 'outline',
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AdminAIMetrics() {
  const [page, setPage] = useState(1);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminAIStats();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useAdminAILogs(page, 10);

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  const statusDistribution = stats ? [
    { name: 'Success', value: stats.successCount, color: PIE_COLORS[0] },
    { name: 'Error', value: stats.errorCount, color: PIE_COLORS[1] },
    { name: 'Rate Limited', value: stats.rateLimitedCount, color: PIE_COLORS[2] },
    { name: 'Credits Depleted', value: stats.creditsDepletedCount, color: PIE_COLORS[3] },
  ].filter(item => item.value > 0) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-violet-500" />
              AI Metrics
            </h1>
            <p className="text-muted-foreground">
              Monitor AI usage, generation stats, and performance
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Generations"
            value={stats?.totalGenerations ?? 0}
            icon={Sparkles}
            loading={statsLoading}
            color="text-violet-500"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate?.toFixed(1) ?? 0}%`}
            icon={CheckCircle}
            loading={statsLoading}
            color="text-green-500"
          />
          <StatCard
            title="Errors (24h)"
            value={stats?.errors24h ?? 0}
            icon={XCircle}
            loading={statsLoading}
            color="text-red-500"
          />
          <StatCard
            title="Avg Gen Time"
            value={`${stats?.avgExecutionTime?.toFixed(0) ?? 0}ms`}
            icon={Clock}
            loading={statsLoading}
            color="text-blue-500"
          />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Rate Limited"
            value={stats?.rateLimitedCount ?? 0}
            icon={AlertTriangle}
            loading={statsLoading}
            color="text-yellow-500"
          />
          <StatCard
            title="Credits Depleted"
            value={stats?.creditsDepletedCount ?? 0}
            icon={CreditCard}
            loading={statsLoading}
            color="text-orange-500"
          />
          <StatCard
            title="Generations (24h)"
            value={stats?.generations24h ?? 0}
            icon={Sparkles}
            loading={statsLoading}
            color="text-purple-500"
          />
          <StatCard
            title="Unique Users"
            value={stats?.uniqueUsers ?? 0}
            icon={CheckCircle}
            loading={statsLoading}
            color="text-cyan-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : statusDistribution.length > 0 ? (
                <ChartContainer config={{}} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Execution Time (Avg by Status)</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : stats?.avgTimeByStatus && stats.avgTimeByStatus.length > 0 ? (
                <ChartContainer config={{}} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.avgTimeByStatus}>
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent AI Activity</CardTitle>
            {logsData?.logs && logsData.logs.length > 0 && (
              <ExportButton
                data={logsData.logs}
                filename="ai-usage-logs"
                columns={['created_at', 'function_name', 'model', 'status', 'execution_time_ms', 'error_message']}
              />
            )}
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logsData?.logs && logsData.logs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Exec Time</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.function_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.model.replace('google/', '')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariants[log.status] || 'secondary'}>
                            {log.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {logsData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(logsData.totalPages, p + 1))}
                      disabled={page >= logsData.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No AI usage logs yet. Generate a cat portrait to see data here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}