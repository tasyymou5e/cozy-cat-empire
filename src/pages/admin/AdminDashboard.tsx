import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Gamepad2,
  Save,
  AlertTriangle,
  Trophy,
  Cat,
  Heart,
  Coins,
} from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  color?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Cat King Admin Panel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats?.userCount ?? 0}
            icon={Users}
            loading={isLoading}
            color="text-blue-500"
          />
          <StatCard
            title="Game Saves"
            value={stats?.gameSaveCount ?? 0}
            icon={Save}
            loading={isLoading}
            color="text-green-500"
          />
          <StatCard
            title="Errors (24h)"
            value={stats?.errorCount24h ?? 0}
            icon={AlertTriangle}
            loading={isLoading}
            color="text-red-500"
          />
          <StatCard
            title="Active Players"
            value={stats?.gameSaveCount ?? 0}
            icon={Gamepad2}
            loading={isLoading}
            color="text-purple-500"
          />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Show Wins"
            value={stats?.totalShowWins ?? 0}
            icon={Trophy}
            loading={isLoading}
            color="text-yellow-500"
          />
          <StatCard
            title="Total Cats"
            value={stats?.totalCats ?? 0}
            icon={Cat}
            loading={isLoading}
            color="text-orange-500"
          />
          <StatCard
            title="Kittens Bred"
            value={stats?.totalKittens ?? 0}
            icon={Heart}
            loading={isLoading}
            color="text-pink-500"
          />
          <StatCard
            title="Total Economy"
            value={`$${(stats?.totalMoney ?? 0).toLocaleString()}`}
            icon={Coins}
            loading={isLoading}
            color="text-emerald-500"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a
              href="/catking/users"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Manage Users
            </a>
            <a
              href="/catking/errors"
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              View Errors
            </a>
            <a
              href="/catking/stats"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              View Statistics
            </a>
            <a
              href="/catking/moderation"
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Moderation Tools
            </a>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
