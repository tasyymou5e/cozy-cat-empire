import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Target } from 'lucide-react';
import { CategoryRank } from '@/hooks/usePlayerStats';

interface CategoryPerformanceChartProps {
  categoryRanks: CategoryRank[];
  loading?: boolean;
}

const categoryLabels: Record<string, string> = {
  wins: 'Show Wins',
  cats: 'Cats Owned',
  breeding: 'Kittens Bred',
  wealth: 'Wealth',
  achievements: 'Achievements',
};

const chartConfig = {
  percentile: {
    label: 'Percentile',
    color: 'hsl(var(--primary))',
  },
};

export function CategoryPerformanceChart({
  categoryRanks,
  loading,
}: CategoryPerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!categoryRanks || categoryRanks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            No performance data yet. Start playing to see your strengths!
          </p>
        </CardContent>
      </Card>
    );
  }

  const radarData = categoryRanks.map((rank) => ({
    category: categoryLabels[rank.category] || rank.category,
    percentile: rank.percentile || 0,
    fullMark: 100,
  }));

  // Find strongest category
  const strongestCategory = categoryRanks.reduce(
    (best, current) => ((current.percentile || 0) > (best.percentile || 0) ? current : best),
    categoryRanks[0]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Performance
          </CardTitle>
          {strongestCategory && (
            <span className="text-sm text-muted-foreground">
              Strongest:{' '}
              <span className="text-primary font-medium">
                {categoryLabels[strongestCategory.category]}
              </span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => [`${value}%`, 'Percentile']}
            />
            <Radar
              name="Percentile"
              dataKey="percentile"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
