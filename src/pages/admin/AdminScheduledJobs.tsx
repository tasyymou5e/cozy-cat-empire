import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Clock, RefreshCw, Play, CheckCircle, XCircle, Calendar, Timer, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

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

export default function AdminScheduledJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [triggerJob, setTriggerJob] = useState<string | null>(null);

  // Fetch cron jobs
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['admin-cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_jobs' as any);
      if (error) {
        console.error('Failed to fetch cron jobs:', error);
        return [] as CronJob[];
      }
      return (data || []) as CronJob[];
    },
  });

  // Fetch job execution history
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['admin-cron-history'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_job_history' as any, { limit_count: 50 });
      if (error) {
        console.error('Failed to fetch job history:', error);
        return [] as CronJobRun[];
      }
      return (data || []) as CronJobRun[];
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
      // Refetch after a delay to show updated history
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
