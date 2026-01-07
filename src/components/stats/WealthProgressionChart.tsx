import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface WealthDataPoint {
  date: string;
  wealth: number;
}

interface WealthProgressionChartProps {
  data: WealthDataPoint[];
  loading?: boolean;
}

const chartConfig = {
  wealth: {
    label: 'Wealth',
    color: 'hsl(var(--primary))',
  },
};

export function WealthProgressionChart({ data, loading }: WealthProgressionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wealth Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wealth Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            No wealth history data yet. Keep playing to track your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const firstValue = data[0]?.wealth || 0;
  const lastValue = data[data.length - 1]?.wealth || 0;
  const growthPercent =
    firstValue > 0 ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1) : 0;
  const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'neutral';

  const formattedData = data.map((d) => ({
    ...d,
    formattedDate: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wealth Progression
          </CardTitle>
          <div
            className={`flex items-center gap-1 text-sm ${
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
            }`}
          >
            {trend === 'up' && <TrendingUp className="h-4 w-4" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4" />}
            {trend === 'neutral' && <Minus className="h-4 w-4" />}
            {growthPercent}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Wealth']}
            />
            <Line
              type="monotone"
              dataKey="wealth"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
