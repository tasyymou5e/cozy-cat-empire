import { useState, useEffect } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship, getRelationshipEmoji, getRelationshipColor } from '@/types/relationships';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CatVisual } from './CatVisual';
import { Sparkles } from 'lucide-react';

/**
 * Props for the SocializePanel component
 */
interface SocializePanelProps {
  /** Array of cats available for socialization */
  cats: Cat[];
  /** Number of treats available (2 required per socialization) */
  treats: number;
  /** Function to get relationship between two cats */
  getRelationship: (catId1: string, catId2: string) => CatRelationship | null;
  /** Callback when socializing two cats */
  onSocialize: (cat1Id: string, cat2Id: string) => void;
  /** Map of cat IDs to equipped costume IDs */
  catCostumes?: Record<string, string>;
  /** Pre-selected first cat ID from Quick Socialize */
  initialCat1Id?: string;
  /** Pre-selected second cat ID from Quick Socialize */
  initialCat2Id?: string;
  /** Callback when pre-selection is cleared after use */
  onClearSelection?: () => void;
}

/**
 * SocializePanel - Cat socialization interface
 * 
 * Allows players to manually socialize two cats to improve their relationship.
 * Uses treats as a resource and shows current relationship status.
 * Supports pre-selection from Quick Socialize feature.
 * 
 * @example
 * ```tsx
 * <SocializePanel
 *   cats={cats}
 *   treats={5}
 *   getRelationship={getRelationship}
 *   onSocialize={handleSocialize}
 *   initialCat1Id="cat-123"
 *   initialCat2Id="cat-456"
 *   onClearSelection={() => clearPair()}
 * />
 * ```
 */

export function SocializePanel({ cats, treats, getRelationship, onSocialize, catCostumes, initialCat1Id, initialCat2Id, onClearSelection }: SocializePanelProps) {
  const [cat1Id, setCat1Id] = useState<string>(initialCat1Id || '');
  const [cat2Id, setCat2Id] = useState<string>(initialCat2Id || '');

  // Sync state when initial values change (Quick Socialize)
  useEffect(() => {
    if (initialCat1Id) setCat1Id(initialCat1Id);
    if (initialCat2Id) setCat2Id(initialCat2Id);
  }, [initialCat1Id, initialCat2Id]);

  const canSocialize = cat1Id && cat2Id && cat1Id !== cat2Id && treats >= 2;
  
  const selectedRelationship = cat1Id && cat2Id && cat1Id !== cat2Id
    ? getRelationship(cat1Id, cat2Id)
    : null;

  const isPreSelected = initialCat1Id && initialCat2Id;

  const handleSocialize = () => {
    if (canSocialize) {
      onSocialize(cat1Id, cat2Id);
      setCat1Id('');
      setCat2Id('');
      onClearSelection?.();
    }
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          🤝 Socialize Cats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Use 2 treats to help cats bond and improve their relationship.
        </p>

        {isPreSelected && (
          <div className="text-xs bg-primary/10 text-primary p-2 rounded-lg flex items-center gap-2 border border-primary/20">
            <Sparkles className="h-3 w-3" />
            Quick Socialize pair selected from Calendar
          </div>
        )}

        {cats.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Need at least 2 cats to socialize.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">First Cat</label>
              <Select value={cat1Id} onValueChange={setCat1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {cats.filter(c => c.id !== cat2Id).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CatVisual cat={cat} size="xs" equippedCostumeId={catCostumes?.[cat.id]} />
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{BREEDS[cat.breed].name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Second Cat</label>
              <Select value={cat2Id} onValueChange={setCat2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {cats.filter(c => c.id !== cat1Id).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CatVisual cat={cat} size="xs" equippedCostumeId={catCostumes?.[cat.id]} />
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{BREEDS[cat.breed].name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRelationship && (
              <div className={`text-sm p-2 rounded-lg bg-secondary/50 ${getRelationshipColor(selectedRelationship.level)}`}>
                <span className="mr-2">{getRelationshipEmoji(selectedRelationship.level)}</span>
                Current: <span className="font-medium capitalize">{selectedRelationship.level}</span>
                <span className="text-muted-foreground ml-2">({selectedRelationship.score > 0 ? '+' : ''}{selectedRelationship.score})</span>
              </div>
            )}

            {cat1Id && cat2Id && !selectedRelationship && (
              <div className="text-sm p-2 rounded-lg bg-secondary/50 text-muted-foreground">
                😐 No existing relationship
              </div>
            )}

            <Button 
              onClick={handleSocialize} 
              disabled={!canSocialize}
              className="w-full"
            >
              {treats < 2 ? '🍬 Need 2 Treats' : '🤝 Socialize (2 treats)'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
