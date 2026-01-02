import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats, useAdminUsers } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminStatistics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ pageSize: 100 });

  const gameMetrics = [
    { name: 'Total Cats', value: stats?.totalCats ?? 0 },
    { name: 'Kittens Bred', value: stats?.totalKittens ?? 0 },
    { name: 'Show Wins', value: stats?.totalShowWins ?? 0 },
  ];

  const topPlayersByWins = usersData?.users
    .filter((u) => u.stats?.total_show_wins)
    .sort((a, b) => (b.stats?.total_show_wins ?? 0) - (a.stats?.total_show_wins ?? 0))
    .slice(0, 5)
    .map((u) => ({
      name: u.display_name || 'Anonymous',
      wins: u.stats?.total_show_wins ?? 0,
    })) || [];

  const topPlayersByCats = usersData?.users
    .filter((u) => u.stats?.total_cats_owned)
    .sort((a, b) => (b.stats?.total_cats_owned ?? 0) - (a.stats?.total_cats_owned ?? 0))
    .slice(0, 5)
    .map((u) => ({
      name: u.display_name || 'Anonymous',
      cats: u.stats?.total_cats_owned ?? 0,
    })) || [];

  const isLoading = statsLoading || usersLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Game Statistics</h1>
          <p className="text-muted-foreground">
            Aggregate game analytics and player performance
          </p>
        </div>

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
      </div>
    </AdminLayout>
  );
}
