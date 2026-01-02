import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENT_DEFS } from '@/types/game';

interface AchievementShowcaseProps {
  unlockedCount: number;
}

const achievementEmojis: Record<string, string> = {
  first_cat: '🐱',
  cat_collector: '😺',
  cat_empire: '👑',
  show_winner: '🏆',
  champion: '🎖️',
  millionaire: '💰',
  breeder: '💕',
  master_breeder: '❤️',
  homeowner: '🏠',
  farmer: '🌾',
  land_baron: '🏰',
  first_friendship: '🤝',
  social_butterfly: '🦋',
  peacemaker: '☮️',
  perfect_match: '💑',
  drama_queen: '👸',
  clique_leader: '👥',
};

export function AchievementShowcase({ unlockedCount }: AchievementShowcaseProps) {
  const totalAchievements = ACHIEVEMENT_DEFS.length;
  const progressPercent = (unlockedCount / totalAchievements) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </span>
          <Badge variant="secondary">
            {unlockedCount} / {totalAchievements}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ACHIEVEMENT_DEFS.map((achievement, index) => {
            const isUnlocked = index < unlockedCount;
            const emoji = achievementEmojis[achievement.id] || '🏅';
            
            return (
              <div
                key={achievement.id}
                className={`relative p-3 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/30 border-muted opacity-60'
                }`}
              >
                <div className="text-center">
                  <span className="text-2xl">{isUnlocked ? emoji : '🔒'}</span>
                  <div className="font-medium text-xs mt-1 truncate">
                    {achievement.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {achievement.description}
                  </div>
                </div>
                {isUnlocked && (
                  <CheckCircle2 className="absolute top-1 right-1 h-3 w-3 text-green-500" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
