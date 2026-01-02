import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { History, TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import { useLeaderboardHistory, RankTrend } from '@/hooks/useLeaderboardHistory';
import { LeaderboardCategory } from '@/hooks/useGlobalLeaderboard';
import { format } from 'date-fns';

interface LeaderboardHistoryChartProps {
  userId: string;
  category: LeaderboardCategory;
  currentRank?: number;
}

const categoryLabels: Record<LeaderboardCategory, string> = {
  wins: 'Show Wins',
  cats: 'Cats Owned',
  breeding: 'Kittens Bred',
  wealth: 'Wealth',
  achievements: 'Achievements',
};

function TrendIndicator({ trend }: { trend: RankTrend }) {
  if (trend.direction === 'up') {
    return (
      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
        <TrendingUp className="h-3 w-3 mr-1" />
        Rising +{trend.amount}
      </Badge>
    );
  }
  if (trend.direction === 'down') {
    return (
      <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
        <TrendingDown className="h-3 w-3 mr-1" />
        Falling -{trend.amount}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Minus className="h-3 w-3 mr-1" />
      Steady
    </Badge>
  );
}

export function LeaderboardHistoryChart({ userId, category, currentRank }: LeaderboardHistoryChartProps) {
  const { history, loading, trend, bestRank } = useLeaderboardHistory(userId, category);

  const chartData = history.map(entry => ({
    date: format(new Date(entry.recorded_at), 'MMM d'),
    rank: entry.rank,
    score: entry.score,
  }));

  const chartConfig = {
    rank: {
      label: 'Rank',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {categoryLabels[category]} Ranking History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">#{currentRank || '—'}</div>
              <div className="text-xs text-muted-foreground">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">#{bestRank || '—'}</div>
              <div className="text-xs text-muted-foreground">Best</div>
            </div>
            <div className="text-center">
              <TrendIndicator trend={trend} />
              <div className="text-xs text-muted-foreground mt-1">Trend</div>
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Loading history...
            </div>
          ) : history.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-center">
              <div>
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Not enough data yet.
                <br />
                <span className="text-sm">Keep playing to track your progress!</span>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  reversed 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `#${value}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`#${value}`, 'Rank']}
                />
                <Line
                  type="monotone"
                  dataKey="rank"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ChartContainer>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Lower rank is better. Chart shows your ranking progression over time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
