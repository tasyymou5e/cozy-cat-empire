import { Clock, Gift, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChallengeWithProgress, ChallengeDifficulty } from '@/types/challenges';

interface WeeklyChallengesPanelProps {
  challenges: ChallengeWithProgress[];
  loading: boolean;
  timeRemaining: string | null;
  onClaimReward: (challengeId: string) => Promise<{ coins: number; badge: string | null } | false>;
  onRewardClaimed?: (coins: number, badge: string | null) => void;
}

const difficultyColors: Record<ChallengeDifficulty, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export function WeeklyChallengesPanel({
  challenges,
  loading,
  timeRemaining,
  onClaimReward,
  onRewardClaimed
}: WeeklyChallengesPanelProps) {
  const handleClaim = async (challengeId: string) => {
    const result = await onClaimReward(challengeId);
    if (result && onRewardClaimed) {
      onRewardClaimed(result.coins, result.badge);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading challenges...</p>
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No active challenges this week. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
          {timeRemaining && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const progress = challenge.progress?.current_progress || 0;
              const percentage = Math.min((progress / challenge.target_value) * 100, 100);
              const isCompleted = challenge.progress?.completed;
              const isClaimed = challenge.progress?.reward_claimed;

              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isCompleted && !isClaimed
                      ? 'bg-primary/10 border-primary/50 animate-pulse'
                      : isClaimed
                      ? 'bg-muted/30 border-muted opacity-60'
                      : 'bg-muted/50 border-border/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{challenge.emoji}</span>
                      <div>
                        <h4 className="font-medium text-sm">{challenge.name}</h4>
                        <p className="text-xs text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                    <Badge className={difficultyColors[challenge.difficulty]}>
                      {challenge.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progress: {progress} / {challenge.target_value}
                      </span>
                      <span className="text-muted-foreground">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Gift className="h-3 w-3 text-primary" />
                      <span className="text-primary font-medium">{challenge.reward_coins} coins</span>
                      {challenge.reward_badge && (
                        <Badge variant="secondary" className="text-xs">
                          {challenge.reward_badge}
                        </Badge>
                      )}
                    </div>

                    {isCompleted && !isClaimed && (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(challenge.id)}
                        className="animate-bounce"
                      >
                        Claim!
                      </Button>
                    )}
                    {isClaimed && (
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        ✓ Claimed
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
