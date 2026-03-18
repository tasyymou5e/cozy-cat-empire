import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Cat, Heart, Coins, Award } from 'lucide-react';
import { CategoryRank } from '@/hooks/usePlayerStats';
import { LeaderboardCategory } from '@/hooks/useGlobalLeaderboard';

interface LeaderboardRankingsProps {
  categoryRanks: CategoryRank[];
}

const categoryConfig: Record<LeaderboardCategory, { label: string; icon: typeof Trophy }> = {
  wins: { label: 'Show Wins', icon: Trophy },
  cats: { label: 'Cats Owned', icon: Cat },
  breeding: { label: 'Kittens Bred', icon: Heart },
  wealth: { label: 'Wealth', icon: Coins },
  achievements: { label: 'Achievements', icon: Award },
};

export function LeaderboardRankings({ categoryRanks }: LeaderboardRankingsProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-foreground">🥇 #1</Badge>;
    if (rank === 2) return <Badge className="bg-muted/70 text-foreground">🥈 #2</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-primary-foreground dark:text-foreground">🥉 #3</Badge>;
    if (rank <= 10) return <Badge variant="default">Top 10</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryRanks.map((cr) => {
            const config = categoryConfig[cr.category];
            return (
              <div key={cr.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <config.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRankBadge(cr.rank)}
                    <span className="text-sm text-muted-foreground">
                      {cr.score.toLocaleString()} pts
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={cr.percentile} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    Top {100 - (cr.percentile || 0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
