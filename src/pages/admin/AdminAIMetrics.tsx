import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useAdminAIStats,
  useAdminAILogs,
  useAdminUserCredits,
  useAdminCreditSummary,
} from '@/hooks/admin';
import { useAdminActivityLog } from '@/hooks/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportButton } from '@/components/admin/ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus,
  Minus,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useToast } from '@/hooks/use-toast';

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

const statusBadgeVariants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  success: 'default',
  error: 'destructive',
  rate_limited: 'secondary',
  credits_depleted: 'outline',
};

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

export default function AdminAIMetrics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();

  const [activeTab, setActiveTab] = useState('overview');
  const [logsPage, setLogsPage] = useState(1);
  const [creditsPage, setCreditsPage] = useState(1);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminAIStats();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useAdminAILogs(logsPage, 10);
  const { data: creditsData, isLoading: creditsLoading } = useAdminUserCredits(creditsPage, 10);
  const { data: creditSummary, isLoading: summaryLoading } = useAdminCreditSummary();

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
    queryClient.invalidateQueries({ queryKey: ['admin-user-credits'] });
    queryClient.invalidateQueries({ queryKey: ['admin-credit-summary'] });
  };

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      // Get current credits
      const { data: current, error: fetchError } = await supabase
        .from('player_portrait_credits')
        .select('credits_remaining, total_purchased')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const previousBalance = current?.credits_remaining || 0;
      const newRemaining = Math.max(0, previousBalance + amount);
      const newPurchased =
        amount > 0
          ? (current?.total_purchased || 0) + amount
          : current?.total_purchased || 0;

      const { error } = await supabase
        .from('player_portrait_credits')
        .update({
          credits_remaining: newRemaining,
          total_purchased: newPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { userId, amount, newRemaining, previousBalance };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-credit-summary'] });
      
      // Comprehensive audit logging with full metadata
      await logActivity({
        actionType: 'portrait_credits_modify',
        actionDescription: `${result.amount > 0 ? 'Granted' : 'Removed'} ${Math.abs(result.amount)} portrait credits via Credit Management`,
        targetUserId: result.userId,
        targetTable: 'player_portrait_credits',
        metadata: {
          change: result.amount,
          previousCredits: result.previousBalance,
          newCredits: result.newRemaining,
          adjustmentMethod: 'credit_management_tab',
          userEmail: selectedUser?.email || 'unknown',
          userDisplayName: selectedUser?.display_name || 'unknown',
        },
      });
      
      toast({
        title: 'Credits Adjusted',
        description: `${result.amount > 0 ? 'Added' : 'Removed'} ${Math.abs(result.amount)} credits.`,
      });
      setAdjustDialogOpen(false);
      setSelectedUser(null);
      setAdjustAmount(0);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openAdjustDialog = (user: any) => {
    setSelectedUser(user);
    setAdjustAmount(0);
    setAdjustDialogOpen(true);
  };

  const statusDistribution = stats
    ? [
        { name: 'Success', value: stats.successCount, color: PIE_COLORS[0] },
        { name: 'Error', value: stats.errorCount, color: PIE_COLORS[1] },
        { name: 'Rate Limited', value: stats.rateLimitedCount, color: PIE_COLORS[2] },
        { name: 'Credits Depleted', value: stats.creditsDepletedCount, color: PIE_COLORS[3] },
      ].filter((item) => item.value > 0)
    : [];

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
              Monitor AI usage, generation stats, and manage credits
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="credits">Credit Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent AI Activity</CardTitle>
                {logsData?.logs && logsData.logs.length > 0 && (
                  <ExportButton
                    data={logsData.logs}
                    filename="ai-usage-logs"
                    columns={[
                      'created_at',
                      'function_name',
                      'model',
                      'status',
                      'execution_time_ms',
                      'error_message',
                    ]}
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
                            <TableCell className="font-mono text-sm">{log.function_name}</TableCell>
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

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {logsPage} of {logsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                          disabled={logsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => Math.min(logsData.totalPages, p + 1))}
                          disabled={logsPage >= logsData.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No AI usage logs yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            {/* Credit Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Users with Credits"
                value={creditSummary?.userCount ?? 0}
                icon={Users}
                loading={summaryLoading}
                color="text-blue-500"
              />
              <StatCard
                title="Total Credits Remaining"
                value={creditSummary?.totalRemaining ?? 0}
                icon={CreditCard}
                loading={summaryLoading}
                color="text-green-500"
              />
              <StatCard
                title="Total Credits Used"
                value={creditSummary?.totalUsed ?? 0}
                icon={Sparkles}
                loading={summaryLoading}
                color="text-violet-500"
              />
              <StatCard
                title="Total Purchased"
                value={creditSummary?.totalPurchased ?? 0}
                icon={Plus}
                loading={summaryLoading}
                color="text-amber-500"
              />
            </div>

            {/* User Credits Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Portrait Credits</CardTitle>
                <CardDescription>Manage individual user credit balances</CardDescription>
              </CardHeader>
              <CardContent>
                {creditsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : creditsData?.credits && creditsData.credits.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Purchased</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditsData.credits.map((credit: any) => (
                          <TableRow key={credit.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{credit.profiles?.avatar_emoji || '😺'}</span>
                                <div>
                                  <p className="font-medium">
                                    {credit.profiles?.display_name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {credit.profiles?.email || credit.user_id.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={credit.credits_remaining > 0 ? 'default' : 'secondary'}
                              >
                                {credit.credits_remaining}
                              </Badge>
                            </TableCell>
                            <TableCell>{credit.total_used}</TableCell>
                            <TableCell>{credit.total_purchased}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {credit.updated_at
                                ? format(new Date(credit.updated_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAdjustDialog(credit)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(credit);
                                    setAdjustAmount(-1);
                                    setAdjustDialogOpen(true);
                                  }}
                                  disabled={credit.credits_remaining <= 0}
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {creditsPage} of {creditsData.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreditsPage((p) => Math.max(1, p - 1))}
                          disabled={creditsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCreditsPage((p) => Math.min(creditsData.totalPages, p + 1))
                          }
                          disabled={creditsPage >= creditsData.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No user credits found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Adjust Credits Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Modify portrait credits for {selectedUser?.profiles?.display_name || 'this user'}.
              Current balance: {selectedUser?.credits_remaining ?? 0}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Add/Remove</Label>
              <Input
                id="amount"
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount (negative to remove)"
              />
              <p className="text-xs text-muted-foreground">
                New balance will be:{' '}
                {Math.max(0, (selectedUser?.credits_remaining ?? 0) + adjustAmount)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser &&
                adjustCreditsMutation.mutate({
                  userId: selectedUser.user_id,
                  amount: adjustAmount,
                })
              }
              disabled={adjustAmount === 0 || adjustCreditsMutation.isPending}
            >
              {adjustAmount >= 0 ? 'Add Credits' : 'Remove Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}