import { DAILY_REWARDS, getRewardForDay, STREAK_MILESTONES } from '@/types/dailyRewards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Flame, Check, Lock, Coins } from 'lucide-react';

interface DailyRewardsPanelProps {
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
  canClaim: boolean;
  showModal: boolean;
  onCloseModal: () => void;
  onClaim: () => void;
}

export function DailyRewardsPanel({
  currentStreak,
  longestStreak,
  totalLogins,
  canClaim,
  showModal,
  onCloseModal,
  onClaim,
}: DailyRewardsPanelProps) {
  const currentDayInCycle = ((currentStreak - 1) % 7) + 1;
  const todayReward = getRewardForDay(currentStreak);
  
  // Find next milestone
  const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
  const nextMilestone = milestoneKeys.find(m => m > currentStreak) || milestoneKeys[milestoneKeys.length - 1];
  const progressToMilestone = Math.min((currentStreak / nextMilestone) * 100, 100);

  return (
    <Dialog open={showModal} onOpenChange={onCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-primary" />
            Daily Login Reward
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Streak Display */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-6 w-6 text-orange-500 animate-bounce-gentle" />
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
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] px-1 py-0">
                      🎁
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Today's Reward Details */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Today's Reward</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="h-3 w-3" />
                      {todayReward.coins} coins
                    </Badge>
                    {todayReward.resources && (
                      <Badge variant="outline" className="text-xs">
                        + Resources
                      </Badge>
                    )}
                  </div>
                  {todayReward.resources && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.entries(todayReward.resources).map(([key, val]) => (
                        <span key={key} className="mr-2">
                          {key}: +{val}
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

          {/* Milestone Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next milestone</span>
              <span className="font-medium">
                {STREAK_MILESTONES[nextMilestone]?.emoji} {nextMilestone} days
              </span>
            </div>
            <Progress value={progressToMilestone} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {nextMilestone - currentStreak} days to go • +{STREAK_MILESTONES[nextMilestone]?.bonusCoins} bonus coins
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
