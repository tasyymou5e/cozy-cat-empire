import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, RefreshCw, Play, CheckCircle, XCircle, Calendar, Timer, Zap, Bell, Mail, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminScheduledJobs');

// Cron expression to human-readable format
function parseCronSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '0') {
    return 'Every Sunday at midnight';
  }
  if (minute === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `Daily at ${displayHour}:00 ${period}`;
  }
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Every day at ${hour}:${minute.padStart(2, '0')}`;
  }

  return schedule;
}

// Map job names to edge function names
const JOB_FUNCTION_MAP: Record<string, string> = {
  'generate-weekly-challenges': 'generate-weekly-challenges',
  'process-leaderboard-rewards': 'process-leaderboard-rewards',
  'cleanup-error-logs-daily': 'cleanup-error-logs',
  'sync-health-check-10min': 'sync-health-check',
};

// Job display info
const JOB_INFO: Record<string, { icon: string; description: string }> = {
  'generate-weekly-challenges': {
    icon: '📋',
    description: 'Generates new weekly challenge quests for all players',
  },
  'process-leaderboard-rewards': {
    icon: '🏆',
    description: 'Awards daily, weekly, and monthly leaderboard rewards',
  },
  'cleanup-error-logs-daily': {
    icon: '🗑️',
    description: 'Removes error logs older than 30 days',
  },
  'sync-health-check-10min': {
    icon: '🩺',
    description: 'Validates data integrity across active game saves every 10 minutes',
  },
};

// Color palette for chart lines
const JOB_COLORS: Record<string, string> = {
  'process-leaderboard-rewards': '#3b82f6',
  'generate-weekly-challenges': '#10b981',
  'cleanup-error-logs-daily': '#f59e0b',
  'sync-health-check-10min': '#ec4899',
};

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  database: string;
  nodename: string;
}

interface CronJobRun {
  runid: number;
  jobid: number;
  jobname: string;
  status: string;
  start_time: string;
  end_time: string | null;
  return_message: string | null;
}

interface JobTrend {
  date: string;
  jobname: string;
  total_runs: number;
  successful: number;
  failed: number;
  avg_duration_ms: number;
}

export default function AdminScheduledJobs() {
  const { toast } = useToast();
  const [triggerJob, setTriggerJob] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch cron jobs
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['admin-cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_jobs' as never);
      if (error) {
        logger.error('Failed to fetch cron jobs:', error);
        return [] as CronJob[];
      }
      return (data || []) as CronJob[];
    },
  });

  // Fetch job execution history
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['admin-cron-history'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_job_history' as never, { limit_count: 50 } as never);
      if (error) {
        logger.error('Failed to fetch job history:', error);
        return [] as CronJobRun[];
      }
      return (data || []) as CronJobRun[];
    },
  });

  // Fetch job trends for charts
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-cron-trends'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_job_trends' as never, { days_back: 14 } as never);
      if (error) {
        logger.error('Failed to fetch job trends:', error);
        return [] as JobTrend[];
      }
      return (data || []) as JobTrend[];
    },
  });

  // Calculate stats
  const stats = {
    totalJobs: jobs?.length ?? 0,
    last24hRuns: history?.filter((h) => {
      const runTime = new Date(h.start_time);
      return runTime > new Date(Date.now() - 24 * 60 * 60 * 1000);
    }).length ?? 0,
    failures: history?.filter((h) => h.status === 'failed').length ?? 0,
  };

  // Prepare chart data - aggregate by date for stacked area
  const chartData = React.useMemo(() => {
    if (!trends || trends.length === 0) return [];

    const dateMap = new Map<string, { date: string; successful: number; failed: number }>();

    trends.forEach((t) => {
      const existing = dateMap.get(t.date);
      if (existing) {
        existing.successful += t.successful;
        existing.failed += t.failed;
      } else {
        dateMap.set(t.date, {
          date: t.date,
          successful: t.successful,
          failed: t.failed,
        });
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        ...d,
        date: format(new Date(d.date), 'MMM d'),
      }));
  }, [trends]);

  // Prepare duration chart data - separate lines per job
  const durationChartData = React.useMemo(() => {
    if (!trends || trends.length === 0) return [];

    const dateMap = new Map<string, Record<string, number | string>>();

    trends.forEach((t) => {
      const dateStr = format(new Date(t.date), 'MMM d');
      const existing = dateMap.get(dateStr) || { date: dateStr };
      existing[t.jobname] = Math.round(t.avg_duration_ms || 0);
      dateMap.set(dateStr, existing);
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      const dateA = new Date(a.date as string);
      const dateB = new Date(b.date as string);
      return dateA.getTime() - dateB.getTime();
    });
  }, [trends]);

  // Get unique job names for duration chart
  const jobNames = React.useMemo(() => {
    if (!trends) return [];
    return [...new Set(trends.map((t) => t.jobname))];
  }, [trends]);

  // Calculate overall stats from trends
  const trendStats = React.useMemo(() => {
    if (!trends || trends.length === 0) {
      return { successRate: 0, avgDuration: 0, totalRuns: 0 };
    }

    const totalSuccessful = trends.reduce((sum, t) => sum + t.successful, 0);
    const totalFailed = trends.reduce((sum, t) => sum + t.failed, 0);
    const totalRuns = totalSuccessful + totalFailed;
    const successRate = totalRuns > 0 ? (totalSuccessful / totalRuns) * 100 : 0;

    const durations = trends.filter((t) => t.avg_duration_ms > 0).map((t) => t.avg_duration_ms);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return { successRate, avgDuration, totalRuns };
  }, [trends]);

  // Manual trigger mutation
  const triggerMutation = useMutation({
    mutationFn: async (jobName: string) => {
      const functionName = JOB_FUNCTION_MAP[jobName];
      if (!functionName) throw new Error('Unknown job');

      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke(functionName, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
    },
    onSuccess: (_, jobName) => {
      toast({
        title: 'Job Triggered',
        description: `${jobName} has been manually triggered`,
      });
      setTimeout(() => {
        refetchHistory();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Trigger Failed',
        description: error instanceof Error ? error.message : 'Failed to trigger job',
        variant: 'destructive',
      });
    },
  });

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-alert', {
        body: {
          job_name: 'Test Job',
          job_id: 0,
          status: 'test',
          error_message: 'This is a test alert to verify the notification system is working correctly.',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          is_test: true,
        },
      });
      if (error) throw error;
      toast({
        title: 'Test Alert Sent',
        description: 'Check your email for the test notification.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRefresh = () => {
    refetchJobs();
    refetchHistory();
  };

  const isLoading = jobsLoading || historyLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Scheduled Jobs
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor automated tasks and cron job execution history
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {stats.totalJobs}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Runs (Last 24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                {stats.last24hRuns}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Failures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <XCircle className={`h-5 w-5 ${stats.failures > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                {stats.failures}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate (14d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                {trendStats.successRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Settings Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-base">Alert Settings</CardTitle>
              </div>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>
            <CardDescription>Receive email notifications when scheduled jobs fail</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Notifications sent to all admin users</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSendTestAlert} disabled={isSendingTest}>
                {isSendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test Alert'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Execution Trends Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle className="text-base">Execution Trends (Last 14 Days)</CardTitle>
              </div>
              <CardDescription>Daily success and failure counts across all jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : chartData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="successful"
                          stackId="1"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.6}
                          name="Succeeded"
                        />
                        <Area
                          type="monotone"
                          dataKey="failed"
                          stackId="1"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.6}
                          name="Failed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Stats below chart */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-500">{trendStats.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{trendStats.totalRuns}</div>
                      <div className="text-xs text-muted-foreground">Total Runs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(trendStats.avgDuration)}ms</div>
                      <div className="text-xs text-muted-foreground">Avg Duration</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duration Patterns Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <CardTitle className="text-base">Execution Duration Patterns</CardTitle>
              </div>
              <CardDescription>Average execution time per job over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : durationChartData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={durationChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} unit="ms" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                        formatter={(value: number) => [`${value}ms`, '']}
                      />
                      <Legend />
                      {jobNames.map((jobname) => (
                        <Line
                          key={jobname}
                          type="monotone"
                          dataKey={jobname}
                          stroke={JOB_COLORS[jobname] || '#8884d8'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name={jobname.replace(/-/g, ' ')}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No duration data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Scheduled cron jobs currently configured</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
            ) : jobs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No cron jobs found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((job) => {
                    const jobInfo = JOB_INFO[job.jobname] || { icon: '⚙️', description: 'Unknown job' };
                    const lastRun = history?.find((h) => h.jobid === job.jobid);
                    
                    return (
                      <TableRow key={job.jobid}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{jobInfo.icon}</span>
                            <div>
                              <div className="font-medium">{job.jobname}</div>
                              <div className="text-xs text-muted-foreground">
                                {jobInfo.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span>{parseCronSchedule(job.schedule)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.active ? 'default' : 'secondary'}>
                            {job.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lastRun ? (
                            <div className="flex items-center gap-2">
                              {lastRun.status === 'succeeded' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(lastRun.start_time), { addSuffix: true })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {JOB_FUNCTION_MAP[job.jobname] && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTriggerJob(job.jobname)}
                              disabled={triggerMutation.isPending}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Run Now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>Recent job executions and their results</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading history...</div>
            ) : history?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No execution history</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history?.slice(0, 20).map((run, index) => {
                    const duration = run.end_time && run.start_time
                      ? new Date(run.end_time).getTime() - new Date(run.start_time).getTime()
                      : null;

                    return (
                      <TableRow key={`${run.jobid}-${index}`}>
                        <TableCell className="font-medium">{run.jobname}</TableCell>
                        <TableCell>
                          <Badge variant={run.status === 'succeeded' ? 'default' : 'destructive'}>
                            {run.status === 'succeeded' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(run.start_time), 'MMM d, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {duration !== null ? `${duration}ms` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {run.return_message || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trigger Confirmation Dialog */}
      <AlertDialog open={!!triggerJob} onOpenChange={() => setTriggerJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Job Manually?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to manually trigger <strong>{triggerJob}</strong>?
              This will execute the job immediately outside of its normal schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (triggerJob) {
                  triggerMutation.mutate(triggerJob);
                  setTriggerJob(null);
                }
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
