import React, { memo, useMemo } from 'react';
import { Achievement } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Props for the AchievementsPanel component
 */
interface AchievementsPanelProps {
  /** Array of all achievements */
  achievements: Achievement[];
  /** Current player statistics for progress calculation */
  currentStats: {
    cats: number;
    showWins: number;
    money: number;
    breeding: number;
    house: boolean;
    farm: boolean;
    acres: number;
    challengesCompleted: number;
  };
}

/**
 * AchievementsPanel - Achievement tracking interface
 *
 * Displays all game achievements with unlock status and progress.
 * Shows progress bars for incomplete achievements.
 *
 * @example
 * ```tsx
 * <AchievementsPanel
 *   achievements={achievements}
 *   currentStats={{ cats: 5, showWins: 3, money: 1000, ... }}
 * />
 * ```
 */

// Memoized achievement item component
const AchievementItem = memo(function AchievementItem({
  achievement,
  progress,
}: {
  achievement: Achievement;
  progress: number;
}) {
  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        achievement.unlocked ? 'bg-accent/20 border-accent' : 'bg-muted/50 border-muted'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`font-medium ${achievement.unlocked ? 'text-accent-foreground' : 'text-muted-foreground'}`}
        >
          {achievement.unlocked ? '✅' : '🔒'} {achievement.name}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
      {!achievement.unlocked && <Progress value={progress} className="h-1.5" />}
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="text-xs text-accent-foreground">
          Unlocked on Day {achievement.unlockedAt}
        </p>
      )}
    </div>
  );
});

export const AchievementsPanel = memo(function AchievementsPanel({
  achievements,
  currentStats,
}: AchievementsPanelProps) {
  const getProgress = (achievement: Achievement) => {
    if (achievement.unlocked) return 100;

    let current = 0;
    switch (achievement.id) {
      case 'first_cat':
      case 'cat_collector':
      case 'cat_empire':
        current = currentStats.cats;
        break;
      case 'show_winner':
      case 'champion':
        current = currentStats.showWins;
        break;
      case 'millionaire':
        current = currentStats.money;
        break;
      case 'breeder':
      case 'master_breeder':
        current = currentStats.breeding;
        break;
      case 'homeowner':
        current = currentStats.house ? 1 : 0;
        break;
      case 'farmer':
        current = currentStats.farm ? 1 : 0;
        break;
      case 'land_baron':
        current = currentStats.acres;
        break;
      case 'challenge_starter':
      case 'challenge_master':
      case 'challenge_legend':
        current = currentStats.challengesCompleted;
        break;
    }
    return Math.min(100, (current / achievement.target) * 100);
  };

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements]
  );

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>🏆 Achievements</span>
          <span className="text-sm font-normal text-muted-foreground">
            {unlockedCount}/{achievements.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {achievements.map((achievement) => (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            progress={getProgress(achievement)}
          />
        ))}
      </CardContent>
    </Card>
  );
});
