import { useGlobalLeaderboard, LeaderboardCategory, LeaderboardEntry } from '@/hooks/useGlobalLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Cat, Heart, Coins, Award, RefreshCw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalLeaderboardPanelProps {
  userId: string | undefined;
}

const categoryConfig: Record<LeaderboardCategory, { label: string; icon: typeof Trophy; scoreKey: keyof LeaderboardEntry }> = {
  wins: { label: 'Show Wins', icon: Trophy, scoreKey: 'total_show_wins' },
  cats: { label: 'Cats Owned', icon: Cat, scoreKey: 'total_cats_owned' },
  breeding: { label: 'Kittens Bred', icon: Heart, scoreKey: 'total_kittens_bred' },
  wealth: { label: 'Wealth', icon: Coins, scoreKey: 'total_money_earned' },
  achievements: { label: 'Achievements', icon: Award, scoreKey: 'achievements_unlocked' },
};

export function GlobalLeaderboardPanel({ userId }: GlobalLeaderboardPanelProps) {
  const {
    leaderboard,
    userRank,
    userStats,
    loading,
    category,
    setCategory,
    fetchLeaderboard,
  } = useGlobalLeaderboard(userId);

  const config = categoryConfig[category];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-black">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Leaderboard
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchLeaderboard} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
          <TabsList className="grid grid-cols-5 mb-4">
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="text-xs px-1">
                <cfg.icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{cfg.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(categoryConfig).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No players on the leaderboard yet.
                  <br />
                  <span className="text-sm">Be the first to compete!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        entry.user_id === userId
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="w-12 text-center">
                        {getRankBadge(entry.rank || 0)}
                      </div>
                      <div className="text-2xl">{entry.avatar_emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {entry.display_name || 'Anonymous Player'}
                          {entry.user_id === userId && (
                            <span className="text-xs text-primary ml-2">(You)</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-bold text-lg">
                        {(entry[config.scoreKey] as number).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User's rank if not in top 20 */}
              {userStats && userRank && userRank > 20 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Your Ranking</div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="w-12 text-center">
                      <Badge variant="outline">#{userRank}</Badge>
                    </div>
                    <div className="text-2xl">{userStats.avatar_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {userStats.display_name || 'Anonymous Player'}
                        <span className="text-xs text-primary ml-2">(You)</span>
                      </div>
                    </div>
                    <div className="text-right font-bold text-lg">
                      {(userStats[config.scoreKey] as number).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {!userId && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                  Log in to see your ranking and compete!
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
