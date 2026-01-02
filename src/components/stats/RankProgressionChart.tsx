import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Medal } from 'lucide-react';
import { format } from 'date-fns';

interface RankHistoryEntry {
  date: string;
  wins?: number;
  cats?: number;
  breeding?: number;
  wealth?: number;
  achievements?: number;
}

interface RankProgressionChartProps {
  data: RankHistoryEntry[];
  loading?: boolean;
}

const chartConfig = {
  wins: {
    label: 'Show Wins',
    color: 'hsl(45, 93%, 47%)',
  },
  cats: {
    label: 'Cats Owned',
    color: 'hsl(210, 100%, 50%)',
  },
  breeding: {
    label: 'Kittens Bred',
    color: 'hsl(340, 82%, 52%)',
  },
  wealth: {
    label: 'Wealth',
    color: 'hsl(142, 71%, 45%)',
  },
  achievements: {
    label: 'Achievements',
    color: 'hsl(280, 65%, 60%)',
  },
};

export function RankProgressionChart({ data, loading }: RankProgressionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Rank History
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
            <Medal className="h-5 w-5" />
            Rank History
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No rank history yet. Your rank changes will appear here!</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(d => ({
    ...d,
    formattedDate: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Rank History
        </CardTitle>
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
              reversed
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[1, 'auto']}
              allowDecimals={false}
              label={{ value: 'Rank', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="wins" 
              stroke={chartConfig.wins.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="cats" 
              stroke={chartConfig.cats.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="breeding" 
              stroke={chartConfig.breeding.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="wealth" 
              stroke={chartConfig.wealth.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="achievements" 
              stroke={chartConfig.achievements.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
