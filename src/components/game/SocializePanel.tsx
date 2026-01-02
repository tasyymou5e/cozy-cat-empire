import { useState } from 'react';
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

interface SocializePanelProps {
  cats: Cat[];
  treats: number;
  getRelationship: (catId1: string, catId2: string) => CatRelationship | null;
  onSocialize: (cat1Id: string, cat2Id: string) => void;
}

export function SocializePanel({ cats, treats, getRelationship, onSocialize }: SocializePanelProps) {
  const [cat1Id, setCat1Id] = useState<string>('');
  const [cat2Id, setCat2Id] = useState<string>('');

  const canSocialize = cat1Id && cat2Id && cat1Id !== cat2Id && treats >= 2;
  
  const selectedRelationship = cat1Id && cat2Id && cat1Id !== cat2Id
    ? getRelationship(cat1Id, cat2Id)
    : null;

  const handleSocialize = () => {
    if (canSocialize) {
      onSocialize(cat1Id, cat2Id);
      setCat1Id('');
      setCat2Id('');
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
                      {cat.name} ({BREEDS[cat.breed].name})
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
                      {cat.name} ({BREEDS[cat.breed].name})
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
