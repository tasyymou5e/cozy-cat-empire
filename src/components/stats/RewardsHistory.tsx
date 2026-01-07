import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Coins } from 'lucide-react';
import { LeaderboardReward } from '@/hooks/useLeaderboardRewards';
import { RewardStats } from '@/hooks/usePlayerStats';
import { formatDistanceToNow } from 'date-fns';

interface RewardsHistoryProps {
  rewards: LeaderboardReward[];
  rewardStats: RewardStats;
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

export function RewardsHistory({ rewards, rewardStats }: RewardsHistoryProps) {
  const claimedRewards = rewards.filter((r) => r.claimed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Rewards History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{rewardStats.totalRewardsClaimed}</div>
            <div className="text-xs text-muted-foreground">Rewards Claimed</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              ${rewardStats.totalCoinsEarned.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Coins Earned</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{rewardStats.badges.length}</div>
            <div className="text-xs text-muted-foreground">Unique Badges</div>
          </div>
        </div>

        {/* Badge Collection */}
        {rewardStats.badges.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Badge Collection</h4>
            <div className="flex flex-wrap gap-2">
              {rewardStats.badges.map((badge, i) => (
                <span key={i} className="text-2xl">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rewards List */}
        <ScrollArea className="h-[200px]">
          {claimedRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No rewards claimed yet.
              <br />
              <span className="text-sm">Compete on the leaderboard to earn rewards!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {claimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{reward.reward_badge || '🏆'}</span>
                    <div>
                      <div className="font-medium text-sm">
                        {periodLabels[reward.period_type]} #{reward.rank}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {categoryLabels[reward.category] || reward.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-500 font-medium">
                      <Coins className="h-3 w-3" />+{reward.reward_coins}
                    </div>
                    {reward.claimed_at && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reward.claimed_at), { addSuffix: true })}
                      </div>
                    )}
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
