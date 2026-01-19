import { useState, useMemo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship, getRelationshipLevel, getRelationshipEmoji } from '@/types/relationships';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Heart, Sparkles, Target, TrendingUp } from 'lucide-react';
import { CatVisual } from './CatVisual';
import { GradeBadge } from './GradeBadge';
import {
  findOptimalBreedingMatches,
  getTierEmoji,
  BreedingMatch,
} from '@/lib/breedingMatchmaking';

/**
 * Props for the BreedingPanel component
 */
interface BreedingPanelProps {
  /** Array of all cats available for breeding */
  cats: Cat[];
  /** Days remaining until breeding is available again */
  cooldown: number;
  /** Whether there is space for a new kitten */
  hasSpace: boolean;
  /** Callback when breeding two cats */
  onBreed: (cat1Id: string, cat2Id: string) => void;
  /** Optional function to check breeding compatibility between two cats */
  getBreedingCompatibility?: (
    cat1Id: string,
    cat2Id: string
  ) => {
    canBreed: boolean;
    bonus: number;
    message: string;
  };
  /** Map of cat IDs to equipped costume IDs */
  catCostumes?: Record<string, string>;
  /** Array of cat relationships for compatibility display */
  relationships?: CatRelationship[];
}

/**
 * BreedingPanel - Cat breeding interface
 *
 * Allows players to select two cats to breed and create kittens.
 * Shows compatibility status and handles breeding cooldowns.
 */
export function BreedingPanel({
  cats,
  cooldown,
  hasSpace,
  onBreed,
  getBreedingCompatibility,
  catCostumes,
  relationships,
}: BreedingPanelProps) {
  const [parent1, setParent1] = useState<string>('');
  const [parent2, setParent2] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const eligibleCats = cats.filter((c) => c.health >= 60 && c.age >= 1);

  const compatibility =
    parent1 && parent2 && parent1 !== parent2 && getBreedingCompatibility
      ? getBreedingCompatibility(parent1, parent2)
      : null;

  const canBreed =
    cooldown === 0 &&
    parent1 &&
    parent2 &&
    parent1 !== parent2 &&
    hasSpace &&
    compatibility?.canBreed !== false;

  const getRelationshipBetween = (cat1Id: string, cat2Id: string) => {
    if (!relationships) return null;
    return relationships.find(
      (r) =>
        (r.catId1 === cat1Id && r.catId2 === cat2Id) || (r.catId1 === cat2Id && r.catId2 === cat1Id)
    );
  };

  // Use the advanced matchmaking algorithm
  const optimalMatches = useMemo(() => {
    if (eligibleCats.length < 2 || !relationships) return [];
    return findOptimalBreedingMatches(cats, relationships, 8);
  }, [cats, eligibleCats.length, relationships]);

  const getTierBadgeClass = (tier: BreedingMatch['tier']) => {
    switch (tier) {
      case 'legendary':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'excellent':
        return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'good':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'average':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'poor':
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRelationshipBadgeVariant = (level: string) => {
    switch (level) {
      case 'bestFriend':
        return 'default';
      case 'friend':
        return 'secondary';
      case 'neutral':
        return 'outline';
      case 'rival':
        return 'destructive';
      case 'enemy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleSelectPair = (cat1Id: string, cat2Id: string) => {
    setParent1(cat1Id);
    setParent2(cat2Id);
    setShowSuggestions(false);
  };

  const handleBreed = () => {
    if (canBreed) {
      onBreed(parent1, parent2);
      setParent1('');
      setParent2('');
    }
  };

  const handleDirectBreed = (cat1Id: string, cat2Id: string) => {
    if (cooldown === 0 && hasSpace) {
      onBreed(cat1Id, cat2Id);
    }
  };

  const getDisabledReason = (pairCanBreed: boolean) => {
    if (cooldown > 0) return `Cooldown: ${cooldown} days remaining`;
    if (!hasSpace) return 'No space for kittens!';
    if (!pairCanBreed) return 'Cannot breed this pair';
    return '';
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">💕 Breeding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cooldown > 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            ⏳ Breeding cooldown: {cooldown} days
          </p>
        )}

        {eligibleCats.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Need 2+ healthy adult cats (health ≥60, age ≥1)
          </p>
        ) : (
          <>
            {/* Smart Matchmaking Section */}
            {optimalMatches.length > 0 && (
              <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-sm font-medium hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Smart Matchmaking
                      <Badge variant="secondary" className="text-xs">
                        {optimalMatches.length} matches
                      </Badge>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Ranked by genetics, grades, relationship, and personality compatibility
                  </p>
                  {optimalMatches.map((match, idx) => {
                    const canDirectBreed = cooldown === 0 && hasSpace && match.canBreed;
                    const disabledReason = getDisabledReason(match.canBreed);

                    return (
                      <div
                        key={`${match.cat1.id}-${match.cat2.id}`}
                        className="p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors space-y-2"
                      >
                        {/* Header row with cats and tier */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <CatVisual
                                cat={match.cat1}
                                size="xs"
                                equippedCostumeId={catCostumes?.[match.cat1.id]}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[70px]">
                                  {match.cat1.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {BREEDS[match.cat1.breed].name} G{match.cat1.grade}
                                </span>
                              </div>
                            </div>
                            <Heart className="h-3 w-3 text-pink-400" />
                            <div className="flex items-center gap-1">
                              <CatVisual
                                cat={match.cat2}
                                size="xs"
                                equippedCostumeId={catCostumes?.[match.cat2.id]}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[70px]">
                                  {match.cat2.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {BREEDS[match.cat2.breed].name} G{match.cat2.grade}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getTierBadgeClass(match.tier)}`}>
                            {getTierEmoji(match.tier)} {match.tier}
                          </Badge>
                        </div>

                        {/* Match score bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Match Score</span>
                            <span className="font-medium">{match.overallScore}%</span>
                          </div>
                          <Progress value={match.overallScore} className="h-1.5" />
                        </div>

                        {/* Score breakdown */}
                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center p-1 rounded bg-background/50">
                                  <div className="font-medium">{match.scores.genetics}%</div>
                                  <div className="text-muted-foreground">Genes</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Breed rarity & synergy</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center p-1 rounded bg-background/50">
                                  <div className="font-medium">{match.scores.grades}%</div>
                                  <div className="text-muted-foreground">Grade</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Parent grade quality</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center p-1 rounded bg-background/50">
                                  <div className="font-medium">{match.scores.relationship}%</div>
                                  <div className="text-muted-foreground">Bond</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Relationship level bonus</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center p-1 rounded bg-background/50">
                                  <div className="font-medium">{match.scores.personality}%</div>
                                  <div className="text-muted-foreground">Pers.</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Personality compatibility</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center p-1 rounded bg-background/50">
                                  <div className="font-medium">{match.scores.health}%</div>
                                  <div className="text-muted-foreground">Health</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Current health & condition</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Kitten estimate */}
                        <div className="flex items-center gap-2 text-xs bg-background/50 p-2 rounded">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Kitten:</span>
                          <span className="font-medium">
                            Grade {match.estimatedKittenGrade.min}-{match.estimatedKittenGrade.max}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium">
                            ${match.estimatedKittenValue.min}-${match.estimatedKittenValue.max}
                          </span>
                          {match.relationshipBonus > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              +{match.relationshipBonus}% bonus
                            </Badge>
                          )}
                        </div>

                        {/* Match reason */}
                        <p className="text-xs text-muted-foreground italic">{match.matchReason}</p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => handleSelectPair(match.cat1.id, match.cat2.id)}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            Select
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-1">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    disabled={!canDirectBreed}
                                    onClick={() => handleDirectBreed(match.cat1.id, match.cat2.id)}
                                  >
                                    <Heart className="h-3 w-3 mr-1" />
                                    Breed Now
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {!canDirectBreed && disabledReason && (
                                <TooltipContent>{disabledReason}</TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Parent 1</label>
              <Select value={parent1} onValueChange={setParent1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCats
                    .filter((c) => c.id !== parent2)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CatVisual
                            cat={cat}
                            size="xs"
                            equippedCostumeId={catCostumes?.[cat.id]}
                          />
                          <span>{cat.name}</span>
                          <GradeBadge grade={cat.grade} size="sm" showStars={false} />
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Parent 2</label>
              <Select value={parent2} onValueChange={setParent2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCats
                    .filter((c) => c.id !== parent1)
                    .map((cat) => {
                      const rel = parent1 ? getRelationshipBetween(parent1, cat.id) : null;
                      const level = rel ? getRelationshipLevel(rel.score) : null;

                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <CatVisual
                              cat={cat}
                              size="xs"
                              equippedCostumeId={catCostumes?.[cat.id]}
                            />
                            <span>{cat.name}</span>
                            <GradeBadge grade={cat.grade} size="sm" showStars={false} />
                            {level && (
                              <Badge
                                variant={getRelationshipBadgeVariant(level)}
                                className="text-xs ml-1 px-1"
                              >
                                {getRelationshipEmoji(level)}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {compatibility && (
              <div
                className={`text-sm p-2 rounded-lg ${
                  compatibility.bonus > 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : compatibility.bonus < 0
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                <span className="mr-2">
                  {compatibility.bonus > 0 ? '💕' : compatibility.bonus < 0 ? '😾' : '😐'}
                </span>
                {compatibility.message}
              </div>
            )}

            <Button onClick={handleBreed} disabled={!canBreed} className="w-full">
              {!hasSpace
                ? '🏠 No Space'
                : cooldown > 0
                  ? '⏳ Cooling Down'
                  : compatibility && !compatibility.canBreed
                    ? '💔 Cannot Breed'
                    : '💕 Breed Cats'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
