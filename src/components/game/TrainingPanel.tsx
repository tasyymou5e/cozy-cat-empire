import { useState } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { TRICKS, TrickId, MIN_SHOW_GRADE } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dumbbell, Sparkles } from 'lucide-react';

interface TrainingPanelProps {
  cats: Cat[];
  treats: number;
  toys: number;
  day: number;
  onTrain: (catId: string, trickId: TrickId) => void;
  onRest: (catId: string) => void;
}

export function TrainingPanel({ cats, treats, toys, day, onTrain, onRest }: TrainingPanelProps) {
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  
  const selectedCat = cats.find(c => c.id === selectedCatId);
  const canTrain = selectedCat && treats >= 1 && toys >= 1 && selectedCat.lastTrainingDay < day;
  
  // Get next trainable trick for selected cat
  const getNextTrick = (cat: Cat): TrickId | null => {
    for (const trick of TRICKS) {
      if (!cat.tricksLearned.includes(trick.id)) {
        return trick.id;
      }
    }
    return null;
  };

  const nextTrick = selectedCat ? getNextTrick(selectedCat) : null;
  const nextTrickInfo = nextTrick ? TRICKS.find(t => t.id === nextTrick) : null;

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Training
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Train cats to learn tricks and improve their grade!
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No cats to train yet.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Cat</label>
              <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cat to train" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {cat.name}
                        <GradeBadge grade={cat.grade} size="sm" showStars={false} />
                        {cat.lastTrainingDay >= day && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600">
                            Trained today
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCat && (
              <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{selectedCat.name}</span>
                  <GradeBadge grade={selectedCat.grade} />
                </div>

                {/* Tricks Progress */}
                <div className="space-y-2">
                  <span className="text-xs font-medium">Tricks Learned</span>
                  <div className="flex flex-wrap gap-1">
                    {TRICKS.map(trick => {
                      const learned = selectedCat.tricksLearned.includes(trick.id);
                      const progress = selectedCat.trickProgress[trick.id] || 0;
                      return (
                        <Badge 
                          key={trick.id}
                          variant={learned ? 'default' : 'outline'}
                          className={`text-xs ${learned ? 'bg-green-500' : progress > 0 ? 'border-primary/50' : ''}`}
                        >
                          {trick.emoji} {trick.name}
                          {!learned && progress > 0 && ` (${progress}%)`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Rest Level */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>😴 Rest Level</span>
                    <span>{selectedCat.restLevel}%</span>
                  </div>
                  <Progress value={selectedCat.restLevel} className="h-2" />
                </div>

                {/* Next Trick Training */}
                {nextTrickInfo && (
                  <div className="p-2 bg-card rounded border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Next: {nextTrickInfo.emoji} {nextTrickInfo.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        +{nextTrickInfo.gradeBonus} grade
                      </Badge>
                    </div>
                    <Progress 
                      value={selectedCat.trickProgress[nextTrickInfo.id] || 0} 
                      className="h-2 mb-2" 
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!canTrain}
                      onClick={() => onTrain(selectedCat.id, nextTrickInfo.id)}
                    >
                      {selectedCat.lastTrainingDay >= day 
                        ? '⏳ Already trained today' 
                        : `🎾 Train (1 treat + 1 toy)`}
                    </Button>
                  </div>
                )}

                {!nextTrickInfo && (
                  <div className="p-2 bg-green-50 rounded border border-green-200 text-center">
                    <Sparkles className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <span className="text-sm text-green-700">All tricks mastered!</span>
                  </div>
                )}

                {/* Rest Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={selectedCat.restLevel >= 100}
                  onClick={() => onRest(selectedCat.id)}
                >
                  😴 Rest Cat (+20 rest, +0.25 grade if rested)
                </Button>

                {/* Show Eligibility */}
                <div className={`text-xs p-2 rounded ${selectedCat.grade >= MIN_SHOW_GRADE ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {selectedCat.grade >= MIN_SHOW_GRADE 
                    ? `✅ Show eligible (Grade ${MIN_SHOW_GRADE}+ required)`
                    : `⚠️ Needs Grade ${MIN_SHOW_GRADE}+ for shows (current: ${selectedCat.grade})`}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
