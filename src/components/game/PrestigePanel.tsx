/**
 * @fileoverview PrestigePanel - Cat prestige system interface
 *
 * Shows cats eligible for prestige and allows players to
 * reset max-grade cats for permanent bonuses.
 */

import { useState } from 'react';
import { Cat } from '@/types/game';
import { usePrestige } from '@/hooks/usePrestige';
import { PRESTIGE_LEVELS, PRESTIGE_BADGE_STYLES, MAX_PRESTIGE_LEVEL } from '@/types/prestige';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { CatAvatar } from './CatAvatar';

interface PrestigePanelProps {
  cats: Cat[];
  catCostumes: Record<string, string>;
  onPrestigeCat: (catId: string, updates: Partial<Cat>) => void;
  onUnlockCostume?: (costumeId: string) => void;
}

export function PrestigePanel({
  cats,
  catCostumes,
  onPrestigeCat,
  onUnlockCostume,
}: PrestigePanelProps) {
  const { canPrestige, prestigeCat, getPrestigeBonuses, getNextPrestigeInfo } = usePrestige();
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const eligibleCats = cats.filter(canPrestige);
  const prestigedCats = cats.filter((c) => (c.prestigeLevel || 0) > 0);

  const handlePrestigeClick = (cat: Cat) => {
    setSelectedCat(cat);
    setShowConfirmDialog(true);
  };

  const handleConfirmPrestige = () => {
    if (!selectedCat) return;

    const updates = prestigeCat(selectedCat);
    if (updates) {
      onPrestigeCat(selectedCat.id, updates);

      // Check for costume reward
      const newLevel = updates.prestigeLevel || 0;
      const levelInfo = PRESTIGE_LEVELS.find((l) => l.stars === newLevel);
      if (levelInfo?.costumeReward && onUnlockCostume) {
        onUnlockCostume(levelInfo.costumeReward);
      }
    }

    setShowConfirmDialog(false);
    setSelectedCat(null);
  };

  const renderStars = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= level ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Prestige Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Cat Prestige System
          </CardTitle>
          <CardDescription>
            Reset Grade 20 cats to Grade 10 for permanent bonuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            {PRESTIGE_LEVELS.map((level) => (
              <div
                key={level.stars}
                className={`p-3 rounded-lg border ${PRESTIGE_BADGE_STYLES[level.stars]}`}
              >
                <div className="flex justify-center mb-1">{renderStars(level.stars)}</div>
                <div className="text-xs font-medium">{level.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />+{level.showEarningsBonus * 100}% Shows
                  </div>
                  {level.breedingSuccessBonus > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-3 w-3" />+{level.breedingSuccessBonus * 100}% Breeding
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eligible Cats */}
      {eligibleCats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Ready to Prestige ({eligibleCats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {eligibleCats.map((cat) => {
                const currentPrestige = cat.prestigeLevel || 0;
                const nextInfo = getNextPrestigeInfo(cat);

                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30"
                  >
                    <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        {renderStars(currentPrestige)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Grade {cat.grade} • {cat.showWins} Show Wins
                      </div>
                      {nextInfo && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Next: +{nextInfo.showEarningsBonus * 100}% show earnings
                          {nextInfo.costumeReward && ' + Exclusive Costume!'}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePrestigeClick(cat)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Prestige
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prestiged Cats */}
      {prestigedCats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Prestiged Cats ({prestigedCats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {prestigedCats.map((cat) => {
                const bonuses = getPrestigeBonuses(cat);
                const isMaxed = (cat.prestigeLevel || 0) >= MAX_PRESTIGE_LEVEL;

                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${PRESTIGE_BADGE_STYLES[cat.prestigeLevel || 0]}`}
                  >
                    <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        {renderStars(cat.prestigeLevel || 0)}
                        {isMaxed && (
                          <Badge variant="secondary" className="text-xs">
                            MAX
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Grade {cat.grade}</div>
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          +{Math.round(bonuses.showEarningsBonus * 100)}% Shows
                        </span>
                        {bonuses.breedingSuccessBonus > 0 && (
                          <span className="text-pink-600 dark:text-pink-400">
                            +{Math.round(bonuses.breedingSuccessBonus * 100)}% Breeding
                          </span>
                        )}
                      </div>
                    </div>
                    {!isMaxed && (
                      <div className="text-right">
                        <Progress value={(cat.grade / 20) * 100} className="w-20 h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          Grade {cat.grade}/20
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {eligibleCats.length === 0 && prestigedCats.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No cats ready for prestige yet</p>
            <p className="text-sm">Train your cats to Grade 20 to unlock prestige!</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Prestige {selectedCat?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will reset {selectedCat?.name} from Grade 20 to Grade 10, but grant permanent
                  bonuses:
                </p>
                {selectedCat && (
                  <div className="bg-muted p-3 rounded-lg">
                    {(() => {
                      const nextInfo = getNextPrestigeInfo(selectedCat);
                      if (!nextInfo) return null;
                      return (
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />+
                            {nextInfo.showEarningsBonus * 100}% show earnings (permanent)
                          </li>
                          {nextInfo.breedingSuccessBonus > 0 && (
                            <li className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-pink-500" />+
                              {nextInfo.breedingSuccessBonus * 100}% breeding success (permanent)
                            </li>
                          )}
                          {nextInfo.costumeReward && (
                            <li className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              Exclusive prestige costume unlocked!
                            </li>
                          )}
                        </ul>
                      );
                    })()}
                  </div>
                )}
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPrestige}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Star className="h-4 w-4 mr-2" />
              Confirm Prestige
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
