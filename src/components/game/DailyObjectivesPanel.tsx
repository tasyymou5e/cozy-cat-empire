import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyObjective } from '@/types/dailyObjectives';
import { Target, CheckCircle2, Gift, Coins, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyObjectivesPanelProps {
  objectives: DailyObjective[];
  allCompleted: boolean;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
  bonusAmount?: number;
}

function ObjectiveCard({ objective }: { objective: DailyObjective }) {
  const progressPercent = (objective.progress / objective.target) * 100;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        objective.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{objective.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{objective.name}</span>
            {objective.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Coins className="h-3 w-3 mr-1" />
                {objective.reward}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{objective.description}</p>
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-xs font-medium tabular-nums">
              {objective.progress}/{objective.target}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DailyObjectivesPanel({
  objectives,
  allCompleted,
  bonusClaimed,
  onClaimBonus,
  bonusAmount = 100,
}: DailyObjectivesPanelProps) {
  const completedCount = objectives.filter((o) => o.completed).length;
  const totalReward = objectives.reduce((sum, o) => sum + (o.completed ? o.reward : 0), 0);

  // Calculate time until refresh
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilRefresh = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesUntilRefresh = Math.floor(
    ((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
  );

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Daily Objectives</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {hoursUntilRefresh}h {minutesUntilRefresh}m
          </Badge>
        </div>
        <CardDescription>Complete objectives for bonus rewards!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {objectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}

        {/* Progress summary */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            Progress: {completedCount}/{objectives.length}
          </span>
          {totalReward > 0 && <Badge variant="secondary">Earned: {totalReward} coins</Badge>}
        </div>

        {/* All complete bonus */}
        <div
          className={cn(
            'p-3 rounded-lg border-2 border-dashed transition-all',
            allCompleted && !bonusClaimed
              ? 'border-primary bg-primary/5 animate-pulse'
              : allCompleted && bonusClaimed
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-muted'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift
                className={cn('h-5 w-5', allCompleted ? 'text-primary' : 'text-muted-foreground')}
              />
              <div>
                <p className="font-medium text-sm">Complete All Bonus</p>
                <p className="text-xs text-muted-foreground">Finish all 3 objectives</p>
              </div>
            </div>
            {bonusClaimed ? (
              <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Claimed
              </Badge>
            ) : allCompleted ? (
              <Button size="sm" onClick={onClaimBonus}>
                <Coins className="h-4 w-4 mr-1" />+{bonusAmount}
              </Button>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                +{bonusAmount} coins
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
