import { useGlobalLeaderboard, LeaderboardCategory, LeaderboardEntry, LeaderboardViewMode, LeaderboardTimePeriod, RankChange } from '@/hooks/useGlobalLeaderboard';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trophy, Cat, Heart, Coins, Award, RefreshCw, Globe, Users, ArrowUp, ArrowDown, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeaderboardHistoryChart } from './LeaderboardHistoryChart';

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

const timePeriodLabels: Record<LeaderboardTimePeriod, string> = {
  all: 'All Time',
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
};

function RankChangeIndicator({ rankChange }: { rankChange?: RankChange }) {
  if (!rankChange || rankChange.direction === 'same') return null;

  if (rankChange.direction === 'new') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-yellow-500 animate-fade-in">
        <Sparkles className="h-3 w-3" />
        NEW
      </span>
    );
  }

  if (rankChange.direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-500 animate-fade-in">
        <ArrowUp className="h-3 w-3" />
        +{rankChange.amount}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 animate-fade-in">
      <ArrowDown className="h-3 w-3" />
      -{rankChange.amount}
    </span>
  );
}

export function GlobalLeaderboardPanel({ userId }: GlobalLeaderboardPanelProps) {
  const { friends } = useFriends(userId);
  const friendIds = friends.map(f => f.id);
  
  const {
    leaderboard,
    userRank,
    userStats,
    loading,
    category,
    setCategory,
    viewMode,
    setViewMode,
    timePeriod,
    setTimePeriod,
    fetchLeaderboard,
    isLive,
  } = useGlobalLeaderboard(userId, friendIds);

  const config = categoryConfig[category];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-black">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const getEmptyMessage = () => {
    if (viewMode === 'friends') {
      if (friendIds.length === 0) {
        return (
          <>
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            You haven't added any friends yet.
            <br />
            <span className="text-sm">Add friends to compare rankings!</span>
          </>
        );
      }
      return (
        <>
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No friends on the leaderboard yet.
          <br />
          <span className="text-sm">Play more to appear here!</span>
        </>
      );
    }
    if (timePeriod !== 'all') {
      return (
        <>
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No activity {timePeriod === 'daily' ? 'today' : timePeriod === 'weekly' ? 'this week' : 'this month'}.
          <br />
          <span className="text-sm">Play to appear on the leaderboard!</span>
        </>
      );
    }
    return (
      <>
        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
        No players on the leaderboard yet.
        <br />
        <span className="text-sm">Be the first to compete!</span>
      </>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {viewMode === 'global' ? (
              <Globe className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            {viewMode === 'global' ? 'Global Leaderboard' : 'Friends Leaderboard'}
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-normal text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {userId && (
              <LeaderboardHistoryChart 
                userId={userId} 
                category={category} 
                currentRank={userRank || undefined} 
              />
            )}
            <Button variant="ghost" size="icon" onClick={fetchLeaderboard} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* View Mode and Time Period Toggles */}
        <div className="mt-2 flex flex-wrap gap-2">
          <TooltipProvider>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as LeaderboardViewMode)}
              className="justify-start"
            >
              <ToggleGroupItem value="global" aria-label="Global leaderboard" className="gap-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Global</span>
              </ToggleGroupItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ToggleGroupItem 
                      value="friends" 
                      aria-label="Friends leaderboard" 
                      className="gap-1"
                      disabled={!userId}
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Friends</span>
                    </ToggleGroupItem>
                  </span>
                </TooltipTrigger>
                {!userId && (
                  <TooltipContent>
                    <p>Log in to view friends leaderboard</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>

          {/* Time Period Toggle */}
          <ToggleGroup
            type="single"
            value={timePeriod}
            onValueChange={(v) => v && setTimePeriod(v as LeaderboardTimePeriod)}
            className="justify-start"
          >
            {Object.entries(timePeriodLabels).map(([key, label]) => (
              <ToggleGroupItem key={key} value={key} className="text-xs px-2">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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
                  {getEmptyMessage()}
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                        entry.user_id === userId
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/50'
                      } ${entry.rankChange?.direction === 'up' ? 'animate-fade-in' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-12 text-center">
                        {getRankBadge(entry.rank || 0)}
                      </div>
                      <div className="text-2xl">{entry.avatar_emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {entry.display_name || 'Anonymous Player'}
                          {entry.user_id === userId && (
                            <span className="text-xs text-primary">(You)</span>
                          )}
                          <RankChangeIndicator rankChange={entry.rankChange} />
                        </div>
                      </div>
                      <div className="text-right font-bold text-lg">
                        {(entry[config.scoreKey] as number).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User's rank if not in top 20 (global only) */}
              {viewMode === 'global' && userStats && userRank && userRank > 20 && (
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
