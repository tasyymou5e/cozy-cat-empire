import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useLeaderboardRewards } from '@/hooks/useLeaderboardRewards';
import { StatsOverviewCards } from '@/components/stats/StatsOverviewCards';
import { LeaderboardRankings } from '@/components/stats/LeaderboardRankings';
import { RewardsHistory } from '@/components/stats/RewardsHistory';
import { AchievementShowcase } from '@/components/stats/AchievementShowcase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BarChart3, RefreshCw, LogIn } from 'lucide-react';

export default function Stats() {
  const { user } = useAuth();
  const { stats, categoryRanks, rewardStats, loading, fetchStats } = usePlayerStats(user?.id);
  const { rewards } = useLeaderboardRewards(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Stats Dashboard</h2>
            <p className="text-muted-foreground mb-6">
              Log in to view your personal statistics, leaderboard rankings, and rewards history.
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Game
                </Button>
              </Link>
              <Link to="/auth">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stats?.avatar_emoji || '😺'}</span>
              <div>
                <h1 className="text-xl font-bold">
                  {stats?.display_name || 'Your Stats'}
                </h1>
                <p className="text-sm text-muted-foreground">Personal Statistics Dashboard</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {loading && !stats ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        ) : stats ? (
          <>
            {/* Overview Cards */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              <StatsOverviewCards stats={stats} />
            </section>

            {/* Rankings and Rewards */}
            <div className="grid md:grid-cols-2 gap-6">
              <LeaderboardRankings categoryRanks={categoryRanks} />
              <RewardsHistory rewards={rewards} rewardStats={rewardStats} />
            </div>

            {/* Achievements */}
            <section>
              <AchievementShowcase unlockedCount={stats.achievements_unlocked} />
            </section>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No Stats Yet</h2>
            <p className="text-muted-foreground mb-4">
              Start playing and sync your progress to see your stats here!
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Play
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
