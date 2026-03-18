import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cat } from '@/types/game';
import {
  LegacyCat,
  RETIREMENT_REQUIREMENTS,
  LEGACY_TRAIT_INFO,
  LEGACY_ACHIEVEMENT_INFO,
  checkRetirementEligibility,
} from '@/types/legacy';
import { Crown, Trophy, Star, Sparkles, Award, Check, X, TrendingUp, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatAvatar } from './CatAvatar';

interface HallOfFamePanelProps {
  cats: Cat[];
  retiredCats: LegacyCat[];
  totalLegacyBonus: number;
  catCostumes: Record<string, string>;
  onRetireCat: (cat: Cat) => void;
  canRetire: (cat: Cat) => boolean;
  getEligibility: (cat: Cat) => ReturnType<typeof checkRetirementEligibility>;
  getKittenBonuses: () => {
    gradeBonus: number;
    healthBonus: number;
    trainingBonus: number;
    relationshipBonus: number;
  };
}

function LegacyCatCard({
  legacy,
  catCostumes,
}: {
  legacy: LegacyCat;
  catCostumes: Record<string, string>;
}) {
  const traitInfo = LEGACY_TRAIT_INFO[legacy.legacyTrait];

  return (
    <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
      <div className="flex items-start gap-3">
        <div className="relative">
          <CatAvatar cat={legacy.cat} equippedCostumeId={catCostumes[legacy.cat.id]} size="md" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-primary-foreground dark:text-foreground text-xs">
            <Crown className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{legacy.cat.name}</span>
            <Badge variant="outline" className="text-xs bg-amber-500/20 border-amber-500/30">
              {traitInfo.emoji} {traitInfo.name}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Retired Day {legacy.retiredAt} • {legacy.cat.breed}
          </p>

          <div className="flex flex-wrap gap-1 mt-2">
            <TooltipProvider delayDuration={100}>
              {legacy.achievements.map((ach) => {
                const info = LEGACY_ACHIEVEMENT_INFO[ach];
                return (
                  <Tooltip key={ach}>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {info.emoji}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{info.name}</TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          <p className="text-xs text-green-600 mt-2 font-medium">
            +{(legacy.legacyBonus * 100).toFixed(1)}% passive bonus
          </p>
        </div>
      </div>
    </div>
  );
}

function EligibleCatCard({
  cat,
  catCostumes,
  onRetire,
  eligibility,
}: {
  cat: Cat;
  catCostumes: Record<string, string>;
  onRetire: () => void;
  eligibility: ReturnType<typeof checkRetirementEligibility>;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-all">
        <div className="flex items-start gap-3">
          <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{cat.name}</span>
              <Badge variant="outline" className="text-xs">
                {eligibility.achievementCount}/4
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
              <div
                className={cn(
                  'flex items-center gap-1',
                  eligibility.meetsShowWins ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {eligibility.meetsShowWins ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {cat.showWins}/{RETIREMENT_REQUIREMENTS.minShowWins} wins
              </div>
              <div
                className={cn(
                  'flex items-center gap-1',
                  eligibility.meetsGrade ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {eligibility.meetsGrade ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Grade {cat.grade}/{RETIREMENT_REQUIREMENTS.minGrade}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1',
                  eligibility.meetsAge ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {eligibility.meetsAge ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Age {cat.age}/{RETIREMENT_REQUIREMENTS.minAge}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1',
                  eligibility.meetsTricks ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {eligibility.meetsTricks ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {cat.tricksLearned?.length || 0}/{RETIREMENT_REQUIREMENTS.minTricks} tricks
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
            onClick={() => setShowConfirm(true)}
          >
            <Crown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Retire {cat.name} to Hall of Fame?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove {cat.name} from your farm and add them to the Hall of
              Fame. They will provide passive bonuses to all future activities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-sm font-medium text-amber-700 mb-2">Legacy Benefits:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • +{(0.01 + eligibility.achievementCount * 0.005) * 100}% passive show money bonus
                </li>
                <li>• Kitten bonuses based on achievements</li>
                <li>• Permanent place in Hall of Fame</li>
              </ul>
            </div>

            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <p className="text-sm font-medium text-red-700">⚠️ Warning:</p>
              <p className="text-sm text-muted-foreground">
                {cat.name} will be permanently removed from your farm. This cannot be undone!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              onClick={() => {
                onRetire();
                setShowConfirm(false);
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              Retire to Hall of Fame
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HallOfFamePanel({
  cats,
  retiredCats,
  totalLegacyBonus,
  catCostumes,
  onRetireCat,
  canRetire,
  getEligibility,
  getKittenBonuses,
}: HallOfFamePanelProps) {
  const kittenBonuses = getKittenBonuses();

  // Find eligible cats
  const eligibleCats = cats.filter((cat) => canRetire(cat));

  // Find cats close to eligibility (1 achievement away)
  const almostEligibleCats = cats
    .filter((cat) => {
      if (canRetire(cat)) return false;
      const eligibility = getEligibility(cat);
      return eligibility.achievementCount === 1;
    })
    .slice(0, 3);

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Hall of Fame</CardTitle>
          </div>
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            {retiredCats.length} Legends
          </Badge>
        </div>
        <CardDescription>Retire legendary cats for permanent bonuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legacy Bonuses Summary */}
        {retiredCats.length > 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Legacy Bonuses</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />+{(totalLegacyBonus * 100).toFixed(1)}% show
                money
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {kittenBonuses.gradeBonus > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Star className="h-3 w-3" />+{kittenBonuses.gradeBonus} kitten grade
                </div>
              )}
              {kittenBonuses.healthBonus > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Heart className="h-3 w-3" />+{kittenBonuses.healthBonus}% kitten health
                </div>
              )}
              {kittenBonuses.trainingBonus > 0 && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Sparkles className="h-3 w-3" />+{kittenBonuses.trainingBonus}% training speed
                </div>
              )}
              {kittenBonuses.relationshipBonus > 0 && (
                <div className="flex items-center gap-1 text-pink-600">
                  <Heart className="h-3 w-3" />+{kittenBonuses.relationshipBonus} relationship
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Eligible Cats */}
        {eligibleCats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Ready to Retire ({eligibleCats.length})
            </h4>
            <div className="space-y-2">
              {eligibleCats.map((cat) => (
                <EligibleCatCard
                  key={cat.id}
                  cat={cat}
                  catCostumes={catCostumes}
                  eligibility={getEligibility(cat)}
                  onRetire={() => onRetireCat(cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Almost Eligible */}
        {almostEligibleCats.length > 0 && eligibleCats.length === 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Almost Ready</h4>
            <div className="space-y-2">
              {almostEligibleCats.map((cat) => {
                const elig = getEligibility(cat);
                return (
                  <div
                    key={cat.id}
                    className="p-2 rounded border bg-muted/30 flex items-center gap-2"
                  >
                    <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="sm" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <p className="text-xs text-muted-foreground">Needs 1 more achievement</p>
                    </div>
                    <Badge variant="outline">{elig.achievementCount}/2</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {eligibleCats.length === 0 &&
          almostEligibleCats.length === 0 &&
          retiredCats.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No cats ready for the Hall of Fame yet</p>
              <p className="text-xs mt-1">
                Cats need 2+ achievements: {RETIREMENT_REQUIREMENTS.minShowWins} wins, Grade{' '}
                {RETIREMENT_REQUIREMENTS.minGrade}+, Age {RETIREMENT_REQUIREMENTS.minAge}+, or all{' '}
                {RETIREMENT_REQUIREMENTS.minTricks} tricks
              </p>
            </div>
          )}

        <Separator />

        {/* Hall of Fame Gallery */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Legends Gallery
          </h4>

          {retiredCats.length > 0 ? (
            <ScrollArea className="h-[250px] pr-2">
              <div className="space-y-2">
                {retiredCats.map((legacy) => (
                  <LegacyCatCard key={legacy.id} legacy={legacy} catCostumes={catCostumes} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>The Hall of Fame awaits its first legend...</p>
            </div>
          )}
        </div>

        {/* Requirements Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs">
          <p className="font-medium mb-1">Retirement Requirements (need 2+):</p>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
            <span>🥇 {RETIREMENT_REQUIREMENTS.minShowWins}+ show wins</span>
            <span>⭐ Grade {RETIREMENT_REQUIREMENTS.minGrade}+</span>
            <span>🧙 Age {RETIREMENT_REQUIREMENTS.minAge}+ days</span>
            <span>🎪 All {RETIREMENT_REQUIREMENTS.minTricks} tricks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
