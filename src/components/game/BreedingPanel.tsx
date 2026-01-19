import { useState, useMemo } from 'react';
import { Cat } from '@/types/game';
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
import { ChevronDown, Heart, Target } from 'lucide-react';
import { CatVisual } from './CatVisual';
import { GradeBadge } from './GradeBadge';

interface BreedingSuggestion {
  cat1: Cat;
  cat2: Cat;
  canBreed: boolean;
  bonus: number;
  message: string;
  relationshipLevel: string;
}

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

  const breedingPairSuggestions = useMemo(() => {
    if (!getBreedingCompatibility || eligibleCats.length < 2) return [];

    const pairs: BreedingSuggestion[] = [];
    for (let i = 0; i < eligibleCats.length; i++) {
      for (let j = i + 1; j < eligibleCats.length; j++) {
        const compat = getBreedingCompatibility(eligibleCats[i].id, eligibleCats[j].id);
        if (compat.canBreed) {
          const rel = getRelationshipBetween(eligibleCats[i].id, eligibleCats[j].id);
          const level = rel ? getRelationshipLevel(rel.score) : 'neutral';
          pairs.push({
            cat1: eligibleCats[i],
            cat2: eligibleCats[j],
            ...compat,
            relationshipLevel: level,
          });
        }
      }
    }
    return pairs.sort((a, b) => b.bonus - a.bonus).slice(0, 5);
  }, [eligibleCats, getBreedingCompatibility, relationships]);

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
            {/* Best Breeding Pairs Section */}
            {breedingPairSuggestions.length > 0 && (
              <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-sm font-medium hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Best Breeding Pairs
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {breedingPairSuggestions.map((pair, idx) => {
                    const canDirectBreed = cooldown === 0 && hasSpace && pair.canBreed;
                    const disabledReason = getDisabledReason(pair.canBreed);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <CatVisual
                              cat={pair.cat1}
                              size="xs"
                              equippedCostumeId={catCostumes?.[pair.cat1.id]}
                            />
                            <span className="text-xs truncate max-w-[60px]">{pair.cat1.name}</span>
                          </div>
                          <span className="text-muted-foreground">+</span>
                          <div className="flex items-center gap-1">
                            <CatVisual
                              cat={pair.cat2}
                              size="xs"
                              equippedCostumeId={catCostumes?.[pair.cat2.id]}
                            />
                            <span className="text-xs truncate max-w-[60px]">{pair.cat2.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={getRelationshipBadgeVariant(pair.relationshipLevel)}
                            className="text-xs"
                          >
                            {getRelationshipEmoji(pair.relationshipLevel as any)}
                            {pair.bonus > 0
                              ? `+${pair.bonus}%`
                              : pair.bonus < 0
                                ? `${pair.bonus}%`
                                : '0%'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleSelectPair(pair.cat1.id, pair.cat2.id)}
                          >
                            Select
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    disabled={!canDirectBreed}
                                    onClick={() => handleDirectBreed(pair.cat1.id, pair.cat2.id)}
                                  >
                                    <Heart className="h-3 w-3 mr-1" />
                                    Breed
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
