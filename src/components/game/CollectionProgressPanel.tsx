import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollectionCategory } from '@/types/collections';
import { BookOpen, Check, Lock, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionItem {
  id: string;
  name: string;
  emoji: string;
  collected: boolean;
}

interface CollectionSetProgress {
  collected: number;
  total: number;
  items: CollectionItem[];
}

interface CollectionProgressPanelProps {
  breedProgress: CollectionSetProgress;
  personalityProgress: CollectionSetProgress;
  costumeProgress: CollectionSetProgress;
  trickProgress: CollectionSetProgress;
  overallProgress: number;
  completedSets: CollectionCategory[];
  getSetReward: (category: CollectionCategory) => {
    coins?: number;
    title?: string;
    bonus?: string;
  };
}

function CollectionSet({
  title,
  emoji,
  progress,
  isComplete,
  reward,
}: {
  title: string;
  emoji: string;
  progress: CollectionSetProgress;
  isComplete: boolean;
  reward: { coins?: number; title?: string; bonus?: string };
}) {
  const percent = (progress.collected / progress.total) * 100;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        isComplete ? 'bg-green-500/10 border-green-500/30' : 'bg-card'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-medium">{title}</span>
        </div>
        {isComplete ? (
          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
            <Check className="h-3 w-3 mr-1" /> Complete!
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {progress.collected}/{progress.total}
          </span>
        )}
      </div>

      <Progress value={percent} className="h-2 mb-3" />

      <div className="flex flex-wrap gap-1 mb-2">
        <TooltipProvider delayDuration={100}>
          {progress.items.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center text-sm border transition-all',
                    item.collected
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/50 border-muted opacity-50'
                  )}
                >
                  {item.collected ? item.emoji : <Lock className="h-3 w-3" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.collected ? 'Collected!' : 'Not yet collected'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Reward preview */}
      <div
        className={cn(
          'text-xs p-2 rounded border-dashed border',
          isComplete ? 'border-green-500/30 bg-green-500/5' : 'border-muted'
        )}
      >
        <span className="font-medium">Reward: </span>
        {reward.coins && <span className="text-amber-600">+{reward.coins} coins</span>}
        {reward.title && <span className="text-purple-600 ml-1">"{reward.title}" title</span>}
        {reward.bonus && <span className="text-green-600 ml-1">• {reward.bonus}</span>}
      </div>
    </div>
  );
}

export function CollectionProgressPanel({
  breedProgress,
  personalityProgress,
  costumeProgress,
  trickProgress,
  overallProgress,
  completedSets,
  getSetReward,
}: CollectionProgressPanelProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Collection Progress</CardTitle>
          </div>
          <Badge variant="outline" className="font-bold">
            {overallProgress}%
          </Badge>
        </div>
        <CardDescription>Complete sets to earn rewards and bonuses!</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{completedSets.length}/4 sets complete</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            <CollectionSet
              title="Breeds"
              emoji="🐱"
              progress={breedProgress}
              isComplete={completedSets.includes('breeds')}
              reward={getSetReward('breeds')}
            />

            <CollectionSet
              title="Personalities"
              emoji="💭"
              progress={personalityProgress}
              isComplete={completedSets.includes('personalities')}
              reward={getSetReward('personalities')}
            />

            <CollectionSet
              title="Costumes"
              emoji="👗"
              progress={costumeProgress}
              isComplete={completedSets.includes('costumes')}
              reward={getSetReward('costumes')}
            />

            <CollectionSet
              title="Tricks"
              emoji="🎪"
              progress={trickProgress}
              isComplete={completedSets.includes('tricks')}
              reward={getSetReward('tricks')}
            />
          </div>
        </ScrollArea>

        {completedSets.length === 4 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-center">
            <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="font-bold text-amber-700">🎉 Master Collector!</p>
            <p className="text-xs text-muted-foreground">You've collected everything!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
