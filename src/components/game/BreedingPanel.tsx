import { useState } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BreedingPanelProps {
  cats: Cat[];
  cooldown: number;
  hasSpace: boolean;
  onBreed: (cat1Id: string, cat2Id: string) => void;
}

export function BreedingPanel({ cats, cooldown, hasSpace, onBreed }: BreedingPanelProps) {
  const [parent1, setParent1] = useState<string>('');
  const [parent2, setParent2] = useState<string>('');

  const eligibleCats = cats.filter(c => c.health >= 60 && c.age >= 1);
  const canBreed = cooldown === 0 && parent1 && parent2 && parent1 !== parent2 && hasSpace;

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

            <Button 
              onClick={handleBreed} 
              disabled={!canBreed}
              className="w-full"
            >
              {!hasSpace ? '🏠 No Space' : cooldown > 0 ? '⏳ Cooling Down' : '💕 Breed Cats'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
