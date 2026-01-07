import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Coins, Check, Sparkles } from 'lucide-react';
import { useLeaderboardRewards, LeaderboardReward } from '@/hooks/useLeaderboardRewards';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardRewardsPanelProps {
  userId: string | undefined;
  onCoinsEarned?: (coins: number) => void;
}

const periodLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const categoryLabels: Record<string, string> = {
  wins: 'Show Wins',
  cats: 'Cats Owned',
  breeding: 'Breeding',
  wealth: 'Wealth',
  achievements: 'Achievements',
};

export function LeaderboardRewardsPanel({ userId, onCoinsEarned }: LeaderboardRewardsPanelProps) {
  const { rewards, unclaimedCount, claimReward, claimAllRewards, REWARD_STRUCTURE } =
    useLeaderboardRewards(userId);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { toast } = useToast();

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Log in to view and claim leaderboard rewards!
        </CardContent>
      </Card>
    );
  }

  const unclaimedRewards = rewards.filter((r) => !r.claimed);

  const handleClaim = async (reward: LeaderboardReward) => {
    setClaiming(reward.id);
    const result = await claimReward(reward.id);
    if (result.success) {
      onCoinsEarned?.(reward.reward_coins);
      toast({
        title: '🎉 Reward Claimed!',
        description: `You earned ${reward.reward_coins} coins!`,
      });
    }
    setClaiming(null);
  };

  const handleClaimAll = async () => {
    setClaiming('all');
    const result = await claimAllRewards();
    if (result.success && result.totalCoins > 0) {
      onCoinsEarned?.(result.totalCoins);
      toast({
        title: '🎉 All Rewards Claimed!',
        description: `You earned ${result.totalCoins} coins total!`,
      });
    }
    setClaiming(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Leaderboard Rewards
            {unclaimedCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unclaimedCount} new
              </Badge>
            )}
          </CardTitle>
          {unclaimedCount > 1 && (
            <Button size="sm" onClick={handleClaimAll} disabled={claiming === 'all'}>
              {claiming === 'all' ? (
                <Sparkles className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Gift className="h-4 w-4 mr-1" />
              )}
              Claim All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Reward Structure Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Top 3 Rewards</h4>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="font-medium">Daily</div>
              <div className="text-muted-foreground">👑100 🥈50 🥉25</div>
            </div>
            <div>
              <div className="font-medium">Weekly</div>
              <div className="text-muted-foreground">👑500 🥈250 🥉100</div>
            </div>
            <div>
              <div className="font-medium">Monthly</div>
              <div className="text-muted-foreground">👑2000 🥈1000 🥉500</div>
            </div>
          </div>
        </div>

        {/* Unclaimed Rewards */}
        <ScrollArea className="h-[200px]">
          {unclaimedRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No pending rewards.
              <br />
              <span className="text-sm">Reach top 3 to earn rewards!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {unclaimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.reward_badge || '🏆'}</span>
                    <div>
                      <div className="font-medium">
                        {periodLabels[reward.period_type]} #{reward.rank}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {categoryLabels[reward.category] || reward.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-500 font-bold">
                        <Coins className="h-4 w-4" />+{reward.reward_coins}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleClaim(reward)}
                      disabled={claiming === reward.id}
                    >
                      {claiming === reward.id ? (
                        <Sparkles className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
