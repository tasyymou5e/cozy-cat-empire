import { useState } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { getRelationshipEmoji, getRelationshipColor } from '@/types/relationships';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  getBreedingCompatibility?: (cat1Id: string, cat2Id: string) => {
    canBreed: boolean;
    bonus: number;
    message: string;
  };
}

/**
 * BreedingPanel - Cat breeding interface
 * 
 * Allows players to select two cats to breed and create kittens.
 * Shows compatibility status and handles breeding cooldowns.
 * 
 * @example
 * ```tsx
 * <BreedingPanel
 *   cats={cats}
 *   cooldown={0}
 *   hasSpace={true}
 *   onBreed={handleBreed}
 *   getBreedingCompatibility={checkCompatibility}
 * />
 * ```
 */

export function BreedingPanel({ cats, cooldown, hasSpace, onBreed, getBreedingCompatibility }: BreedingPanelProps) {
  const [parent1, setParent1] = useState<string>('');
  const [parent2, setParent2] = useState<string>('');

  const eligibleCats = cats.filter(c => c.health >= 60 && c.age >= 1);
  
  const compatibility = parent1 && parent2 && parent1 !== parent2 && getBreedingCompatibility
    ? getBreedingCompatibility(parent1, parent2)
    : null;

  const canBreed = cooldown === 0 && parent1 && parent2 && parent1 !== parent2 && hasSpace && 
    (compatibility?.canBreed !== false);

  const handleBreed = () => {
    if (canBreed) {
      onBreed(parent1, parent2);
      setParent1('');
      setParent2('');
    }
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          💕 Breeding
        </CardTitle>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent 1</label>
              <Select value={parent1} onValueChange={setParent1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCats.filter(c => c.id !== parent2).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({BREEDS[cat.breed].name})
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
                  {eligibleCats.filter(c => c.id !== parent1).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({BREEDS[cat.breed].name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {compatibility && (
              <div className={`text-sm p-2 rounded-lg ${
                compatibility.bonus > 0 ? 'bg-green-50 text-green-700 border border-green-200' :
                compatibility.bonus < 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-secondary/50 text-muted-foreground'
              }`}>
                <span className="mr-2">
                  {compatibility.bonus > 0 ? '💕' : compatibility.bonus < 0 ? '😾' : '😐'}
                </span>
                {compatibility.message}
              </div>
            )}

            <Button 
              onClick={handleBreed} 
              disabled={!canBreed}
              className="w-full"
            >
              {!hasSpace ? '🏠 No Space' : 
               cooldown > 0 ? '⏳ Cooling Down' : 
               compatibility && !compatibility.canBreed ? '💔 Cannot Breed' :
               '💕 Breed Cats'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
