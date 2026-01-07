import {
  DAILY_REWARDS,
  getRewardForDay,
  STREAK_MILESTONES,
  VIPTier,
  VIP_TIERS,
  getVIPTier,
  getNextVIPTier,
} from '@/types/dailyRewards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Flame, Check, Coins, Crown, Star } from 'lucide-react';

interface DailyRewardsPanelProps {
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
  canClaim: boolean;
  showModal: boolean;
  onCloseModal: () => void;
  onClaim: () => void;
  vipTier?: VIPTier | null;
  isVIP?: boolean;
}

export function DailyRewardsPanel({
  currentStreak,
  longestStreak,
  totalLogins,
  canClaim,
  showModal,
  onCloseModal,
  onClaim,
  vipTier,
  isVIP,
}: DailyRewardsPanelProps) {
  const safeStreak = Math.max(currentStreak, 1);
  const currentDayInCycle = ((safeStreak - 1) % 7) + 1;
  const todayReward = getRewardForDay(safeStreak);
  const nextVipTier = getNextVIPTier(currentStreak);

  // Calculate VIP-enhanced rewards
  const enhancedCoins = vipTier
    ? Math.floor(todayReward.coins * vipTier.coinMultiplier)
    : todayReward.coins;

  // Find next milestone (streak or VIP)
  const milestoneKeys = Object.keys(STREAK_MILESTONES)
    .map(Number)
    .sort((a, b) => a - b);
  const nextMilestone =
    milestoneKeys.find((m) => m > currentStreak) || milestoneKeys[milestoneKeys.length - 1];
  const progressToMilestone = Math.min((currentStreak / nextMilestone) * 100, 100);

  // VIP progress calculation
  const getVIPProgress = () => {
    if (!vipTier && currentStreak < 30) {
      return {
        progress: (currentStreak / 30) * 100,
        label: `${30 - currentStreak} days to VIP Bronze`,
        target: 30,
      };
    }
    if (nextVipTier) {
      const prevMinStreak = vipTier?.minStreak || 0;
      const progress =
        ((currentStreak - prevMinStreak) / (nextVipTier.minStreak - prevMinStreak)) * 100;
      return {
        progress,
        label: `${nextVipTier.minStreak - currentStreak} days to ${nextVipTier.name}`,
        target: nextVipTier.minStreak,
      };
    }
    return { progress: 100, label: 'Maximum VIP Tier!', target: 90 };
  };

  const vipProgress = getVIPProgress();

  return (
    <Dialog open={showModal} onOpenChange={onCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-primary" />
            Daily Login Reward
            {isVIP && vipTier && (
              <Badge className="ml-auto bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold animate-vip-glow">
                {vipTier.emoji} {vipTier.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* VIP Status Display */}
          {isVIP && vipTier && (
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-lg border border-amber-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl animate-bounce-gentle">{vipTier.emoji}</span>
                <div className="text-center">
                  <h3 className="font-bold text-lg text-amber-600 dark:text-amber-400">
                    {vipTier.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {vipTier.coinMultiplier}x coins • {vipTier.resourceMultiplier}x resources
                  </p>
                </div>
              </div>

              {/* VIP Perks */}
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {vipTier.perks.slice(0, 3).map((perk, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] border-amber-500/50 bg-amber-500/10"
                  >
                    ✨ {perk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Streak Display */}
          <div
            className={`flex items-center justify-center gap-4 p-4 rounded-lg ${
              isVIP
                ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10'
                : 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10'
            }`}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame
                  className={`h-6 w-6 ${isVIP ? 'text-amber-500' : 'text-orange-500'} animate-streak-flame`}
                />
                <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
              </div>
              <span className="text-sm text-muted-foreground">Day Streak</span>
            </div>
            {longestStreak > currentStreak && (
              <div className="text-center opacity-60">
                <span className="text-lg font-medium">{longestStreak}</span>
                <span className="text-xs text-muted-foreground block">Best</span>
              </div>
            )}
          </div>

          {/* 7-Day Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAILY_REWARDS.map((reward, index) => {
              const dayNum = index + 1;
              const isPast = dayNum < currentDayInCycle;
              const isToday = dayNum === currentDayInCycle;
              const isFuture = dayNum > currentDayInCycle;

              return (
                <div
                  key={dayNum}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    isToday
                      ? 'bg-primary/20 border-primary shadow-lg ring-2 ring-primary/50 animate-glow-pulse'
                      : isPast
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-muted/30 border-muted opacity-50'
                  }`}
                >
                  <span className="text-lg">{isPast ? '✅' : isToday ? reward.emoji : '🔒'}</span>
                  <span className="text-[10px] font-medium">{reward.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Coins className="h-2 w-2" />
                    {reward.coins}
                  </span>
                  {reward.isMilestone && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 text-[8px] px-1 py-0"
                    >
                      🎁
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Today's Reward Details */}
          <Card
            className={`border-primary/20 ${isVIP ? 'bg-gradient-to-br from-amber-500/5 to-yellow-500/10' : 'bg-gradient-to-br from-primary/5 to-primary/10'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Today's Reward</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="h-3 w-3" />
                      {enhancedCoins} coins
                    </Badge>
                    {todayReward.resources && (
                      <Badge variant="outline" className="text-xs">
                        + Resources
                      </Badge>
                    )}
                  </div>
                  {isVIP && vipTier && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      VIP: {todayReward.coins} × {vipTier.coinMultiplier} = {enhancedCoins}
                    </div>
                  )}
                  {todayReward.resources && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.entries(todayReward.resources).map(([key, val]) => (
                        <span key={key} className="mr-2">
                          {key}: +
                          {isVIP && vipTier ? Math.floor(val * vipTier.resourceMultiplier) : val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={onClaim}
                  disabled={!canClaim}
                  className={canClaim ? 'animate-bounce-gentle' : ''}
                >
                  {canClaim ? (
                    <>
                      <Gift className="h-4 w-4 mr-1" />
                      Claim!
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Claimed
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VIP Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Crown className="h-4 w-4" />
                {isVIP ? 'Next VIP tier' : 'VIP Progress'}
              </span>
              <span className="font-medium">
                {nextVipTier ? (
                  <>
                    {nextVipTier.emoji} {vipProgress.label}
                  </>
                ) : isVIP ? (
                  <span className="text-amber-500">🌟 Max Tier!</span>
                ) : (
                  <>🥉 {vipProgress.label}</>
                )}
              </span>
            </div>
            <Progress
              value={vipProgress.progress}
              className={`h-2 ${isVIP ? '[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500' : ''}`}
            />
            {!isVIP && currentStreak < 30 && (
              <div className="text-xs text-muted-foreground text-center">
                🥉 VIP Bronze: 1.5x coins • 1.25x resources
              </div>
            )}
          </div>

          {/* Milestone Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next streak milestone</span>
              <span className="font-medium">
                {STREAK_MILESTONES[nextMilestone]?.emoji} {nextMilestone} days
              </span>
            </div>
            <Progress value={progressToMilestone} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {nextMilestone - currentStreak} days to go • +
              {STREAK_MILESTONES[nextMilestone]?.bonusCoins} bonus coins
            </div>
          </div>

          {/* Stats Footer */}
          <div className="flex justify-center gap-6 pt-2 border-t text-sm text-muted-foreground">
            <span>Total logins: {totalLogins}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
