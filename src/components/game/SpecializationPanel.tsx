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
import { Cat, CatSpecializationData } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import {
  SpecializationType,
  SPECIALIZATIONS,
  SPECIALIZATION_MIN_GRADE,
  MASTERY_LEVELS,
  getMasteryLevel,
  getNextMasteryLevel,
  checkSpecializationEligibility,
} from '@/types/specializations';
import { Star, Sparkles, Crown, Heart, Trophy, Zap, TrendingUp, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatAvatar } from './CatAvatar';

interface SpecializationPanelProps {
  cats: Cat[];
  catCostumes: Record<string, string>;
  relationships: CatRelationship[];
  kittensBred: number;
  onSpecialize: (catId: string, type: SpecializationType) => void;
  canSpecialize: (
    cat: Cat,
    friendshipCount: number,
    kittenCount: number
  ) => ReturnType<typeof checkSpecializationEligibility>;
  getSpecialization: (cat: Cat) => CatSpecializationData | undefined;
  getActiveBonuses: () => {
    showScoreBonus: number;
    showMoneyBonus: number;
    relationshipBonus: number;
    kittenGradeBonus: number;
    kittenHealthBonus: number;
    breedingSuccessBonus: number;
  };
}

const SPEC_ICONS: Record<SpecializationType, typeof Star> = {
  show_star: Star,
  social_butterfly: Heart,
  dynasty_builder: Crown,
};

const SPEC_COLORS: Record<SpecializationType, string> = {
  show_star: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  social_butterfly: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
  dynasty_builder: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

function SpecializedCatCard({
  cat,
  spec,
  catCostumes,
}: {
  cat: Cat;
  spec: CatSpecializationData;
  catCostumes: Record<string, string>;
}) {
  const specDef = SPECIALIZATIONS[spec.type];
  const mastery = getMasteryLevel(spec.xp);
  const nextMastery = getNextMasteryLevel(spec.xp);
  const Icon = SPEC_ICONS[spec.type];

  const xpProgress = nextMastery
    ? ((spec.xp - mastery.xpRequired) / (nextMastery.xpRequired - mastery.xpRequired)) * 100
    : 100;

  return (
    <div className={cn('p-3 rounded-lg border', SPEC_COLORS[spec.type])}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="md" />
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-primary-foreground dark:text-foreground text-xs',
              spec.type === 'show_star' && 'bg-amber-500',
              spec.type === 'social_butterfly' && 'bg-pink-500',
              spec.type === 'dynasty_builder' && 'bg-purple-500'
            )}
          >
            <Icon className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{cat.name}</span>
            <Badge variant="outline" className={cn('text-xs', SPEC_COLORS[spec.type])}>
              {specDef.emoji} {specDef.name}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {mastery.name} (Lv.{mastery.level})
            </Badge>
            <span className="text-xs text-muted-foreground">{spec.xp} XP</span>
          </div>

          {nextMastery && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Next: {nextMastery.name}</span>
                <span>
                  {spec.xp}/{nextMastery.xpRequired} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-1.5" />
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            <TooltipProvider delayDuration={100}>
              {specDef.bonuses.map((bonus, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1.5">
                      {bonus.description.split(' ')[0]}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {bonus.description} (×{mastery.bonusMultiplier})
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

function EligibleCatCard({
  cat,
  catCostumes,
  eligibility,
  onSpecialize,
}: {
  cat: Cat;
  catCostumes: Record<string, string>;
  eligibility: ReturnType<typeof checkSpecializationEligibility>;
  onSpecialize: (type: SpecializationType) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPath, setSelectedPath] = useState<SpecializationType | null>(null);

  const handleConfirm = () => {
    if (selectedPath) {
      onSpecialize(selectedPath);
      setShowDialog(false);
      setSelectedPath(null);
    }
  };

  return (
    <>
      <div className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-all">
        <div className="flex items-start gap-3">
          <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{cat.name}</span>
              <Badge variant="outline" className="text-xs">
                Grade {cat.grade}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {eligibility.eligiblePaths.map((path) => {
                const spec = SPECIALIZATIONS[path];
                const Icon = SPEC_ICONS[path];
                return (
                  <Button
                    key={path}
                    size="sm"
                    variant="outline"
                    className={cn('h-7 text-xs', SPEC_COLORS[path])}
                    onClick={() => {
                      setSelectedPath(path);
                      setShowDialog(true);
                    }}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {spec.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPath && (
                <>
                  {SPECIALIZATIONS[selectedPath].emoji}
                  Specialize {cat.name} as {SPECIALIZATIONS[selectedPath].name}?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              This is a permanent choice. {cat.name} will gain unique bonuses based on this
              specialization.
            </DialogDescription>
          </DialogHeader>

          {selectedPath && (
            <div className="space-y-3 py-4">
              <div className={cn('p-3 rounded-lg border', SPEC_COLORS[selectedPath])}>
                <p className="text-sm font-medium mb-2">Specialization Bonuses:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {SPECIALIZATIONS[selectedPath].bonuses.map((bonus, i) => (
                    <li key={i}>• {bonus.description}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-xs">
                <p className="font-medium mb-1">Mastery Progression:</p>
                <p className="text-muted-foreground">
                  Earn XP through related activities to unlock higher mastery levels with increased
                  bonuses (up to 2×).
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              className={cn(
                selectedPath === 'show_star' && 'bg-amber-500 hover:bg-amber-600',
                selectedPath === 'social_butterfly' && 'bg-pink-500 hover:bg-pink-600',
                selectedPath === 'dynasty_builder' && 'bg-purple-500 hover:bg-purple-600'
              )}
              onClick={handleConfirm}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Specialize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SpecializationPanel({
  cats,
  catCostumes,
  relationships,
  kittensBred,
  onSpecialize,
  canSpecialize,
  getSpecialization,
  getActiveBonuses,
}: SpecializationPanelProps) {
  const bonuses = getActiveBonuses();

  // Count friendships per cat
  const getFriendshipCount = (catId: string) => {
    return relationships.filter((r) => (r.catId1 === catId || r.catId2 === catId) && r.score >= 20)
      .length;
  };

  // Find eligible cats
  const eligibleCats = cats.filter((cat) => {
    if (getSpecialization(cat)) return false;
    const eligibility = canSpecialize(cat, getFriendshipCount(cat.id), kittensBred);
    return eligibility.isEligible;
  });

  // Find almost eligible cats (Grade 10-11)
  const almostEligibleCats = cats
    .filter((cat) => {
      if (getSpecialization(cat)) return false;
      return cat.grade >= 10 && cat.grade < SPECIALIZATION_MIN_GRADE;
    })
    .slice(0, 3);

  // Specialized cats
  const specializedCats = cats.filter((cat) => getSpecialization(cat));

  const hasAnyBonuses = Object.values(bonuses).some((v) => v > 0);

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Specializations</CardTitle>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {specializedCats.length} Specialists
          </Badge>
        </div>
        <CardDescription>
          Train elite cats in specialized paths at Grade {SPECIALIZATION_MIN_GRADE}+
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Bonuses Summary */}
        {hasAnyBonuses && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Specialization Bonuses</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {bonuses.showScoreBonus > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="h-3 w-3" />+{bonuses.showScoreBonus.toFixed(0)}% show score
                </div>
              )}
              {bonuses.showMoneyBonus > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Trophy className="h-3 w-3" />+{bonuses.showMoneyBonus.toFixed(0)}% show money
                </div>
              )}
              {bonuses.relationshipBonus > 0 && (
                <div className="flex items-center gap-1 text-pink-600">
                  <Heart className="h-3 w-3" />+{bonuses.relationshipBonus.toFixed(0)}% relationship
                </div>
              )}
              {bonuses.kittenGradeBonus > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Crown className="h-3 w-3" />+{bonuses.kittenGradeBonus.toFixed(0)} kitten grade
                </div>
              )}
              {bonuses.kittenHealthBonus > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Zap className="h-3 w-3" />+{bonuses.kittenHealthBonus.toFixed(0)}% kitten health
                </div>
              )}
              {bonuses.breedingSuccessBonus > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Sparkles className="h-3 w-3" />+{bonuses.breedingSuccessBonus.toFixed(0)}%
                  breeding
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
              <Zap className="h-4 w-4 text-primary" />
              Ready to Specialize ({eligibleCats.length})
            </h4>
            <div className="space-y-2">
              {eligibleCats.map((cat) => (
                <EligibleCatCard
                  key={cat.id}
                  cat={cat}
                  catCostumes={catCostumes}
                  eligibility={canSpecialize(cat, getFriendshipCount(cat.id), kittensBred)}
                  onSpecialize={(type) => onSpecialize(cat.id, type)}
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
              {almostEligibleCats.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2 rounded border bg-muted/30 flex items-center gap-2"
                >
                  <CatAvatar cat={cat} equippedCostumeId={catCostumes[cat.id]} size="sm" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <p className="text-xs text-muted-foreground">
                      Grade {cat.grade} → needs Grade {SPECIALIZATION_MIN_GRADE}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {SPECIALIZATION_MIN_GRADE - cat.grade} grades to go
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {eligibleCats.length === 0 &&
          almostEligibleCats.length === 0 &&
          specializedCats.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No cats ready for specialization yet</p>
              <p className="text-xs mt-1">
                Train cats to Grade {SPECIALIZATION_MIN_GRADE}+ and meet path requirements
              </p>
            </div>
          )}

        <Separator />

        {/* Specialized Cats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Specialized Cats
          </h4>

          {specializedCats.length > 0 ? (
            <ScrollArea className="h-[250px] pr-2">
              <div className="space-y-2">
                {specializedCats.map((cat) => {
                  const spec = getSpecialization(cat)!;
                  return (
                    <SpecializedCatCard
                      key={cat.id}
                      cat={cat}
                      spec={spec}
                      catCostumes={catCostumes}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No specialized cats yet</p>
            </div>
          )}
        </div>

        {/* Path Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs">
          <p className="font-medium mb-2">Specialization Paths:</p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-amber-500" />
              <span>
                <strong>Show Star:</strong> 5+ wins • Show bonuses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-3 w-3 text-pink-500" />
              <span>
                <strong>Social Butterfly:</strong> 3+ friends • Relationship bonuses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-purple-500" />
              <span>
                <strong>Dynasty Builder:</strong> 2+ kittens • Breeding bonuses
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
