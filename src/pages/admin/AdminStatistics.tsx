import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats, useAdminUsers, useAdminRetentionAnalytics } from '@/hooks/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Coins,
  PiggyBank,
  CalendarDays,
  Flame,
  Activity,
} from 'lucide-react';
import { useMemo } from 'react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];
const WEALTH_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];
const STREAK_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

export default function AdminStatistics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ pageSize: 100 });
  const { data: retentionData, isLoading: retentionLoading } = useAdminRetentionAnalytics();

  const gameMetrics = [
    { name: 'Total Cats', value: stats?.totalCats ?? 0 },
    { name: 'Kittens Bred', value: stats?.totalKittens ?? 0 },
    { name: 'Show Wins', value: stats?.totalShowWins ?? 0 },
  ];

  const topPlayersByWins =
    usersData?.users
      .filter((u) => u.stats?.total_show_wins)
      .sort((a, b) => (b.stats?.total_show_wins ?? 0) - (a.stats?.total_show_wins ?? 0))
      .slice(0, 5)
      .map((u) => ({
        name: u.display_name || 'Anonymous',
        wins: u.stats?.total_show_wins ?? 0,
      })) || [];

  const topPlayersByCats =
    usersData?.users
      .filter((u) => u.stats?.total_cats_owned)
      .sort((a, b) => (b.stats?.total_cats_owned ?? 0) - (a.stats?.total_cats_owned ?? 0))
      .slice(0, 5)
      .map((u) => ({
        name: u.display_name || 'Anonymous',
        cats: u.stats?.total_cats_owned ?? 0,
      })) || [];

  // Economy Data
  const economyData = useMemo(() => {
    if (!usersData?.users) return null;

    const usersWithMoney = usersData.users
      .filter((u) => u.stats?.total_money_earned !== undefined)
      .map((u) => ({
        id: u.id,
        name: u.display_name || u.email?.split('@')[0] || 'Anonymous',
        money: u.stats?.total_money_earned ?? 0,
        cats: u.stats?.total_cats_owned ?? 0,
        wins: u.stats?.total_show_wins ?? 0,
        kittens: u.stats?.total_kittens_bred ?? 0,
      }));

    // Top earners
    const topEarners = [...usersWithMoney].sort((a, b) => b.money - a.money).slice(0, 10);

    // Wealth distribution buckets
    const wealthBuckets = [
      { name: '$0-$1K', min: 0, max: 1000, count: 0 },
      { name: '$1K-$10K', min: 1000, max: 10000, count: 0 },
      { name: '$10K-$50K', min: 10000, max: 50000, count: 0 },
      { name: '$50K-$100K', min: 50000, max: 100000, count: 0 },
      { name: '$100K+', min: 100000, max: Infinity, count: 0 },
    ];

    usersWithMoney.forEach((u) => {
      const bucket = wealthBuckets.find((b) => u.money >= b.min && u.money < b.max);
      if (bucket) bucket.count++;
    });

    // Calculate stats
    const totalMoney = usersWithMoney.reduce((sum, u) => sum + u.money, 0);
    const avgMoney = usersWithMoney.length > 0 ? totalMoney / usersWithMoney.length : 0;
    const medianMoney =
      usersWithMoney.length > 0
        ? ([...usersWithMoney].sort((a, b) => a.money - b.money)[
            Math.floor(usersWithMoney.length / 2)
          ]?.money ?? 0)
        : 0;

    // Top 10% wealth share (Gini-like indicator)
    const top10Percent = Math.ceil(usersWithMoney.length * 0.1);
    const top10Wealth = [...usersWithMoney]
      .sort((a, b) => b.money - a.money)
      .slice(0, top10Percent)
      .reduce((sum, u) => sum + u.money, 0);
    const top10Share = totalMoney > 0 ? (top10Wealth / totalMoney) * 100 : 0;

    // Potential exploits detection
    const avgWinnings =
      usersWithMoney.length > 0
        ? usersWithMoney.reduce((sum, u) => sum + u.money, 0) / usersWithMoney.length
        : 0;
    const stdDev = Math.sqrt(
      usersWithMoney.reduce((sum, u) => sum + Math.pow(u.money - avgWinnings, 2), 0) /
        usersWithMoney.length
    );
    const exploitThreshold = avgWinnings + stdDev * 3; // 3 standard deviations

    const potentialExploits = usersWithMoney
      .filter((u) => {
        // Flag if money is unusually high relative to activity
        const moneyPerWin = u.wins > 0 ? u.money / u.wins : u.money;
        const expectedMoneyPerWin =
          avgWinnings /
          (usersWithMoney.reduce((sum, x) => sum + x.wins, 0) / usersWithMoney.length || 1);

        return u.money > exploitThreshold || moneyPerWin > expectedMoneyPerWin * 5;
      })
      .slice(0, 5);

    return {
      topEarners,
      wealthBuckets,
      totalMoney,
      avgMoney,
      medianMoney,
      top10Share,
      potentialExploits,
      usersWithMoney,
    };
  }, [usersData?.users]);

  const isLoading = statsLoading || usersLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Game Statistics</h1>
          <p className="text-muted-foreground">
            Aggregate game analytics, player performance, and economy metrics
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.userCount ?? 0}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Cats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats?.totalCats ?? 0}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Cats/Player
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {stats?.userCount
                        ? ((stats?.totalCats ?? 0) / stats.userCount).toFixed(1)
                        : 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Economy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${(stats?.totalMoney ?? 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Game Metrics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Game Metrics Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={gameMetrics}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {gameMetrics.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Players by Wins */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Players by Show Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : topPlayersByWins.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topPlayersByWins} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="wins" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Players by Cats */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Players by Cats Owned</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : topPlayersByCats.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topPlayersByCats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="cats" fill="hsl(var(--secondary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Show Wins</span>
                    <span className="font-bold">{stats?.totalShowWins ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Kittens Bred</span>
                    <span className="font-bold">{stats?.totalKittens ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Game Saves</span>
                    <span className="font-bold">{stats?.gameSaveCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Win Rate Avg</span>
                    <span className="font-bold">
                      {stats?.userCount && stats?.totalShowWins
                        ? (stats.totalShowWins / stats.userCount).toFixed(1)
                        : 0}{' '}
                      per player
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="economy" className="space-y-6">
            {/* Economy Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Wealth
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${(economyData?.totalMoney ?? 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Wealth
                  </CardTitle>
                  <PiggyBank className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${Math.round(economyData?.avgMoney ?? 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Median Wealth
                  </CardTitle>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${(economyData?.medianMoney ?? 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top 10% Share
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {(economyData?.top10Share ?? 0).toFixed(1)}%
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">of total wealth</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Wealth Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Wealth Distribution
                  </CardTitle>
                  <CardDescription>Number of players in each wealth bracket</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : economyData?.wealthBuckets ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={economyData.wealthBuckets}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                          {economyData.wealthBuckets.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={WEALTH_COLORS[index % WEALTH_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Earners */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Top Earners
                  </CardTitle>
                  <CardDescription>Players with the highest total earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : economyData?.topEarners && economyData.topEarners.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={economyData.topEarners.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                        />
                        <Bar dataKey="money" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Potential Exploits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Potential Exploit Detection
                </CardTitle>
                <CardDescription>
                  Players with unusual wealth patterns (3+ standard deviations or high money-per-win
                  ratio)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : economyData?.potentialExploits && economyData.potentialExploits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Show Wins</TableHead>
                        <TableHead>Cats Owned</TableHead>
                        <TableHead>Earnings/Win</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {economyData.potentialExploits.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell className="font-mono">
                            ${player.money.toLocaleString()}
                          </TableCell>
                          <TableCell>{player.wins}</TableCell>
                          <TableCell>{player.cats}</TableCell>
                          <TableCell className="font-mono">
                            $
                            {player.wins > 0
                              ? Math.round(player.money / player.wins).toLocaleString()
                              : player.money.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                            >
                              Review
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                    <p>No suspicious activity detected</p>
                    <p className="text-sm">All player wealth patterns appear normal</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Wealthiest Players</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : economyData?.topEarners && economyData.topEarners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Cats</TableHead>
                        <TableHead>Wins</TableHead>
                        <TableHead>Kittens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {economyData.topEarners.map((player, index) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            {index < 3 ? (
                              <span
                                className={`text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-muted-foreground' : 'text-amber-600'}`}
                              >
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell className="font-mono text-emerald-600">
                            ${player.money.toLocaleString()}
                          </TableCell>
                          <TableCell>{player.cats}</TableCell>
                          <TableCell>{player.wins}</TableCell>
                          <TableCell>{player.kittens}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No wealth data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            {/* Retention Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">DAU</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{retentionData?.dau ?? 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {(retentionData?.dauPercent ?? 0).toFixed(1)}% of users
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">WAU</CardTitle>
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{retentionData?.wau ?? 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {(retentionData?.wauPercent ?? 0).toFixed(1)}% of users
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">MAU</CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{retentionData?.mau ?? 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {(retentionData?.mauPercent ?? 0).toFixed(1)}% of users
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Streak
                  </CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {(retentionData?.avgStreak ?? 0).toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Max: {retentionData?.maxStreak ?? 0} days
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Streak Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Login Streak Distribution
                  </CardTitle>
                  <CardDescription>Number of players in each streak range</CardDescription>
                </CardHeader>
                <CardContent>
                  {retentionLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : retentionData?.streakDistribution ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={retentionData.streakDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                          {retentionData.streakDistribution.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STREAK_COLORS[index % STREAK_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Activity Summary
                  </CardTitle>
                  <CardDescription>User engagement metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {retentionLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Total Users</span>
                        <span className="font-bold">{retentionData?.totalUsers ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Total Logins (All Time)</span>
                        <span className="font-bold">
                          {(retentionData?.totalLogins ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">DAU/MAU Ratio</span>
                        <Badge
                          variant={
                            retentionData?.dau && retentionData?.mau && retentionData.mau > 0
                              ? retentionData.dau / retentionData.mau > 0.2
                                ? 'default'
                                : 'secondary'
                              : 'secondary'
                          }
                        >
                          {retentionData?.mau && retentionData.mau > 0
                            ? ((retentionData.dau / retentionData.mau) * 100).toFixed(1)
                            : 0}
                          %
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Longest Streak</span>
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="font-bold">{retentionData?.maxStreak ?? 0} days</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Avg Login Streak</span>
                        <span className="font-bold">
                          {(retentionData?.avgStreak ?? 0).toFixed(1)} days
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
