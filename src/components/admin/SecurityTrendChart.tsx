/**
 * Security Trend Chart Component
 *
 * Displays historical security scores over time using a line chart.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { SecurityScanHistory } from '@/types/admin';

interface SecurityTrendChartProps {
  history: SecurityScanHistory[];
  isLoading?: boolean;
}

// Grade thresholds for reference lines
const GRADE_THRESHOLDS = [
  { value: 90, grade: 'A', color: '#22c55e' },
  { value: 80, grade: 'B', color: '#3b82f6' },
  { value: 70, grade: 'C', color: '#eab308' },
  { value: 60, grade: 'D', color: '#f97316' },
];

export function SecurityTrendChart({ history, isLoading }: SecurityTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Trend
          </CardTitle>
          <CardDescription>Score history over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 opacity-50" />
            <p>No scan history yet</p>
            <p className="text-sm">Run a security scan to start tracking trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = history
    .slice()
    .reverse() // Oldest first for chart
    .map((scan) => ({
      date: format(new Date(scan.scanned_at), 'MMM d'),
      fullDate: format(new Date(scan.scanned_at), 'MMM d, yyyy h:mm a'),
      score: scan.security_score,
      grade: scan.security_grade,
      errors: scan.errors,
      warnings: scan.warnings,
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium">{data.fullDate}</p>
        <div className="mt-1 space-y-1">
          <p>
            Score: <span className="font-bold">{data.score}</span> (Grade {data.grade})
          </p>
          {data.errors > 0 && (
            <p className="text-red-500">{data.errors} critical issue{data.errors !== 1 ? 's' : ''}</p>
          )}
          {data.warnings > 0 && (
            <p className="text-yellow-500">{data.warnings} warning{data.warnings !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    );
  };

  // Calculate trend stats
  const latestScore = chartData[chartData.length - 1]?.score ?? 0;
  const oldestScore = chartData[0]?.score ?? 0;
  const overallTrend = latestScore - oldestScore;
  const avgScore = Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Security Trend
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>Score history over time</span>
          <span className="text-xs">
            Avg: {avgScore} |{' '}
            {overallTrend >= 0 ? (
              <span className="text-green-500">↑ {overallTrend} pts overall</span>
            ) : (
              <span className="text-red-500">↓ {Math.abs(overallTrend)} pts overall</span>
            )}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Grade threshold reference lines */}
              {GRADE_THRESHOLDS.map((threshold) => (
                <ReferenceLine
                  key={threshold.grade}
                  y={threshold.value}
                  stroke={threshold.color}
                  strokeDasharray="5 5"
                  strokeOpacity={0.3}
                />
              ))}

              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          {GRADE_THRESHOLDS.map((threshold) => (
            <div key={threshold.grade} className="flex items-center gap-1">
              <div
                className="w-3 h-0.5"
                style={{ backgroundColor: threshold.color }}
              />
              <span className="text-muted-foreground">
                {threshold.grade} ({threshold.value}+)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
