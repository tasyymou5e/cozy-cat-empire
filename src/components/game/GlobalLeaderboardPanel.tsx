import { useMemo } from 'react';
import {
  useGlobalLeaderboard,
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardViewMode,
  LeaderboardTimePeriod,
  RankChange,
  ScrollMode,
} from '@/hooks/useGlobalLeaderboard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useFriends } from '@/hooks/useFriends';
import { useLeaderboardRewards } from '@/hooks/useLeaderboardRewards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Trophy,
  Cat,
  Heart,
  Coins,
  Award,
  RefreshCw,
  Globe,
  Users,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar,
  Gift,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Rows3,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeaderboardHistoryChart } from './LeaderboardHistoryChart';
import { LeaderboardRewardsPanel } from './LeaderboardRewardsPanel';

interface GlobalLeaderboardPanelProps {
  userId: string | undefined;
}

const categoryConfig: Record<
  LeaderboardCategory,
  { label: string; icon: typeof Trophy; scoreKey: keyof LeaderboardEntry }
> = {
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
        <ArrowUp className="h-3 w-3" />+{rankChange.amount}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 animate-fade-in">
      <ArrowDown className="h-3 w-3" />-{rankChange.amount}
    </span>
  );
}

export function GlobalLeaderboardPanel({ userId }: GlobalLeaderboardPanelProps) {
  const { friends } = useFriends(userId);
  // Memoize friendIds to prevent unnecessary re-fetches
  const friendIds = useMemo(() => friends.map((f) => f.id), [friends]);
  const { unclaimedCount } = useLeaderboardRewards(userId);

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
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    hasNextPage,
    hasPrevPage,
    pageSize,
    // Infinite scroll
    scrollMode,
    setScrollMode,
    allEntries,
    hasMore,
    loadingMore,
    loadMore,
  } = useGlobalLeaderboard(userId, friendIds);

  const { lastElementRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  // Determine which entries to display based on scroll mode
  const displayEntries = scrollMode === 'infinite' ? allEntries : leaderboard;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const config = categoryConfig[category];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-foreground">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-muted/70 text-foreground">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-primary-foreground dark:text-foreground">🥉 3rd</Badge>;
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
          No activity{' '}
          {timePeriod === 'daily' ? 'today' : timePeriod === 'weekly' ? 'this week' : 'this month'}.
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
            {viewMode === 'global' ? <Globe className="h-5 w-5" /> : <Users className="h-5 w-5" />}
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
            {userId && unclaimedCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Gift className="h-3 w-3 mr-1" />
                {unclaimedCount}
              </Badge>
            )}
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

        {/* View Mode, Scroll Mode, and Time Period Toggles */}
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
              <ToggleGroupItem
                value="friends"
                aria-label="Friends leaderboard"
                className="gap-1"
                disabled={!userId}
                title={!userId ? 'Log in to view friends leaderboard' : undefined}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Friends</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </TooltipProvider>

          {/* Scroll Mode Toggle */}
          <ToggleGroup
            type="single"
            value={scrollMode}
            onValueChange={(v) => v && setScrollMode(v as ScrollMode)}
            className="justify-start"
          >
            <ToggleGroupItem
              value="pagination"
              aria-label="Pagination mode"
              className="gap-1"
              title="Pagination"
            >
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="infinite"
              aria-label="Infinite scroll mode"
              className="gap-1"
              title="Infinite Scroll"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

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
              {loading && !loadingMore ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading leaderboard...
                </div>
              ) : displayEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{getEmptyMessage()}</div>
              ) : (
                <div className="space-y-2">
                  {displayEntries.map((entry, index) => {
                    const isLastElement =
                      scrollMode === 'infinite' && index === displayEntries.length - 1;
                    return (
                      <div
                        key={entry.id}
                        ref={isLastElement ? lastElementRef : undefined}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                          entry.user_id === userId
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-muted/50'
                        } ${entry.rankChange?.direction === 'up' ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-12 text-center">{getRankBadge(entry.rank || 0)}</div>
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
                    );
                  })}
                </div>
              )}

              {/* Infinite Scroll Loading/End Indicators */}
              {scrollMode === 'infinite' && (
                <>
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!hasMore && displayEntries.length > 0 && !loading && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      You've reached the end of the leaderboard!
                    </div>
                  )}
                </>
              )}

              {/* Pagination Controls (only in pagination mode) */}
              {scrollMode === 'pagination' && totalPages > 1 && !loading && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalCount)} of {totalCount} players
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={!hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {getPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="min-w-[32px]"
                          >
                            {page}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={!hasNextPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* User's rank if not visible (global only) */}
              {viewMode === 'global' &&
                userStats &&
                userRank &&
                !displayEntries.find((e) => e.user_id === userId) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Your Ranking</span>
                      {scrollMode === 'pagination' && userRank > pageSize && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs h-auto p-0"
                          onClick={() => goToPage(Math.ceil(userRank / pageSize))}
                        >
                          Jump to my rank
                        </Button>
                      )}
                    </div>
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

        {/* Rewards Section */}
        {userId && (
          <div className="mt-4 pt-4 border-t">
            <LeaderboardRewardsPanel userId={userId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
