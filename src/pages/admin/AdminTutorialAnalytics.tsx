import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useTutorialAnalytics, 
  useTutorialAnalyticsTrends 
} from '@/hooks/admin/useTutorialAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  GraduationCap, 
  Users, 
  Clock, 
  TrendingDown, 
  SkipForward,
  Target,
  ArrowRight,
} from 'lucide-react';

const STEP_NAMES: Record<string, string> = {
  welcome: 'Welcome',
  first_cat: 'First Cat',
  caring: 'Caring',
  earning: 'Earning Money',
  bulk_actions: 'Bulk Actions',
  training: 'Training',
  costumes: 'Costumes',
  breeding: 'Breeding',
  specializations: 'Specializations',
  relationships: 'Relationships',
  friends_trading: 'Friends & Trading',
  coop: 'Co-op',
  objectives: 'Objectives',
  weekly_challenges: 'Challenges',
  season_pass: 'Season Pass',
  lucky_wheel: 'Lucky Wheel',
  hall_of_fame: 'Hall of Fame',
  ready: 'Ready!',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}

function AdminTutorialAnalyticsContent() {
  const { data: analytics, isLoading: analyticsLoading } = useTutorialAnalytics();
  const { data: trends, isLoading: trendsLoading } = useTutorialAnalyticsTrends(14);

  if (analyticsLoading || trendsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-80" />
        </div>
      </AdminLayout>
    );
  }

  const completionPieData = [
    { name: 'Completed', value: analytics?.completedSessions || 0 },
    { name: 'Abandoned', value: analytics?.abandonedSessions || 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Tutorial Analytics
          </h1>
          <p className="text-muted-foreground">
            Track player tutorial engagement and identify improvement opportunities
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Sessions"
            value={analytics?.totalSessions || 0}
            icon={Users}
          />
          <StatCard
            title="Completion Rate"
            value={`${analytics?.completionRate.toFixed(1)}%`}
            subtitle={`${analytics?.completedSessions} completed`}
            icon={Target}
          />
          <StatCard
            title="Avg. Completion Time"
            value={formatTime(analytics?.avgCompletionTimeMs || 0)}
            icon={Clock}
          />
          <StatCard
            title="Drop-offs"
            value={analytics?.abandonedSessions || 0}
            subtitle="Early exits"
            icon={TrendingDown}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion vs Abandonment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {completionPieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">14-Day Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="displayDate" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      name="Sessions"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      name="Completed"
                      stroke="hsl(142 76% 36%)" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="abandoned" 
                      name="Abandoned"
                      stroke="hsl(0 84% 60%)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step-by-Step Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step Performance</CardTitle>
            <CardDescription>
              View counts, average time spent, and drop-off rates per step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.stepMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="stepId" 
                    className="text-xs"
                    tickFormatter={(id) => STEP_NAMES[id] || id}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(id) => STEP_NAMES[id as string] || id}
                    formatter={(value, name) => {
                      if (name === 'avgTimeMs') return [formatTime(value as number), 'Avg Time'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="viewCount" name="Views" fill="hsl(var(--primary))" />
                  <Bar dataKey="dropOffCount" name="Drop-offs" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Drop-off Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Top Drop-off Points
              </CardTitle>
              <CardDescription>Steps where players abandon the tutorial most</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.dropOffPoints.length === 0 ? (
                <p className="text-muted-foreground text-sm">No drop-offs recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.dropOffPoints.map((point, i) => (
                    <div key={point.stepId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="font-medium">
                            {STEP_NAMES[point.stepId] || point.stepId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Step {point.stepIndex + 1}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{point.count}</p>
                        <p className="text-xs text-muted-foreground">drop-offs</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Jump Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SkipForward className="h-5 w-5" />
                Section Jumps
              </CardTitle>
              <CardDescription>Which sections players skip to most</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.sectionJumps.length === 0 ? (
                <p className="text-muted-foreground text-sm">No section jumps recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.sectionJumps.map((jump) => {
                    const maxCount = analytics.sectionJumps[0]?.count || 1;
                    const percentage = (jump.count / maxCount) * 100;
                    return (
                      <div key={jump.section}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            {jump.section}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {jump.count} jumps
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time per Step Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Average Time per Step
            </CardTitle>
            <CardDescription>
              Identify steps where players spend too much or too little time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics?.stepMetrics.map((step) => {
                const maxTime = Math.max(...(analytics.stepMetrics.map(s => s.avgTimeMs) || [1]));
                const percentage = (step.avgTimeMs / maxTime) * 100;
                const isLong = step.avgTimeMs > 30000; // > 30 seconds
                const isShort = step.avgTimeMs < 3000 && step.avgTimeMs > 0; // < 3 seconds
                
                return (
                  <div key={step.stepId} className="flex items-center gap-3">
                    <span className="w-28 text-sm truncate" title={STEP_NAMES[step.stepId]}>
                      {STEP_NAMES[step.stepId] || step.stepId}
                    </span>
                    <div className="flex-1">
                      <Progress 
                        value={percentage} 
                        className={`h-3 ${isLong ? '[&>div]:bg-amber-500' : isShort ? '[&>div]:bg-blue-500' : ''}`}
                      />
                    </div>
                    <span className={`w-16 text-sm text-right ${isLong ? 'text-amber-600' : isShort ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {formatTime(step.avgTimeMs)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500" /> Long (30s+)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500" /> Quick (&lt;3s)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AdminTutorialAnalytics() {
  return (
    <AdminRoute>
      <AdminTutorialAnalyticsContent />
    </AdminRoute>
  );
}
