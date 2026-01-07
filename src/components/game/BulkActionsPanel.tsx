import { useState, useMemo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Heart,
  Smile,
  Moon,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Zap,
  HeartHandshake,
} from 'lucide-react';
import { CatVisual } from './CatVisual';

/**
 * Props for the BulkActionsPanel component
 */
interface BulkActionsProps {
  /** Array of all cats */
  cats: Cat[];
  /** Current resource amounts */
  resources: { food: number; medicine: number; toys: number; treats: number };
  /** Current game day */
  day: number;
  /** Cat relationships for happiness calculations */
  relationships: CatRelationship[];
  /** Callback to heal all sick cats */
  onHealAll: () => void;
  /** Callback to rest all tired cats */
  onRestAll: () => void;
  /** Callback to comfort all unhappy cats */
  onComfortAll: () => void;
  /** Callback to train all available cats */
  onTrainAll: () => void;
  /** Callback to sell selected cats */
  onSellSelected: (catIds: string[]) => void;
  /** Callback to socialize all neglected relationships */
  onSocializeAll?: () => void;
  /** Map of cat IDs to equipped costume IDs */
  catCostumes?: Record<string, string>;
}

/**
 * BulkActionsPanel - Mass cat management interface
 *
 * Provides bulk operations for managing multiple cats at once.
 * Includes heal all, rest all, comfort all, train all, and bulk sell.
 * Shows status summary badges for cats needing attention.
 *
 * @example
 * ```tsx
 * <BulkActionsPanel
 *   cats={cats}
 *   resources={resources}
 *   day={currentDay}
 *   relationships={relationships}
 *   onHealAll={handleHealAll}
 *   onRestAll={handleRestAll}
 *   onComfortAll={handleComfortAll}
 *   onTrainAll={handleTrainAll}
 *   onSellSelected={handleSellSelected}
 * />
 * ```
 */

export function BulkActionsPanel({
  cats,
  resources,
  day,
  relationships,
  onHealAll,
  onRestAll,
  onComfortAll,
  onTrainAll,
  onSellSelected,
  onSocializeAll,
  catCostumes,
}: BulkActionsProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // Calculate stats
  const sickCats = cats.filter((c) => c.health < 70);
  const tiredCats = cats.filter((c) => c.restLevel < 50);
  const unhappyCats = cats.filter((c) => c.happiness < 50);
  const trainableCats = cats.filter((c) => c.lastTrainingDay < day && c.tricksLearned.length < 5);

  // Calculate neglected relationships (2+ days since last interaction)
  const neglectedRelationships = useMemo(() => {
    return relationships.filter((rel) => {
      const daysSinceInteraction = day - rel.lastInteraction;
      // Only count if both cats still exist
      const cat1Exists = cats.some((c) => c.id === rel.catId1);
      const cat2Exists = cats.some((c) => c.id === rel.catId2);
      return daysSinceInteraction >= 2 && cat1Exists && cat2Exists;
    });
  }, [relationships, day, cats]);

  const medicineCost = sickCats.length;
  const trainCost = trainableCats.length;
  const socializeCost = neglectedRelationships.length * 2;
  const canHealAll = sickCats.length > 0 && resources.medicine >= medicineCost;
  const canRestAll = tiredCats.length > 0;
  const canComfortAll = unhappyCats.length > 0;
  const canTrainAll =
    trainableCats.length > 0 && resources.treats >= trainCost && resources.toys >= trainCost;
  const canSocializeAll = neglectedRelationships.length > 0 && resources.treats >= socializeCost;

  const toggleSelect = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const selectAll = () => setSelectedCats(cats.map((c) => c.id));
  const deselectAll = () => setSelectedCats([]);

  const handleSellSelected = () => {
    onSellSelected(selectedCats);
    setSelectedCats([]);
    setSelectMode(false);
  };

  const totalSellValue = cats
    .filter((c) => selectedCats.includes(c.id))
    .reduce((sum, cat) => sum + Math.floor(cat.value * (1 + cat.showWins * 0.1)), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Bulk Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          {sickCats.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              🤒 {sickCats.length} sick
            </Badge>
          )}
          {tiredCats.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              😴 {tiredCats.length} tired
            </Badge>
          )}
          {unhappyCats.length > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
              😿 {unhappyCats.length} unhappy
            </Badge>
          )}
          {trainableCats.length > 0 && (
            <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600">
              🎯 {trainableCats.length} trainable
            </Badge>
          )}
          {neglectedRelationships.length > 0 && (
            <Badge variant="outline" className="gap-1 border-pink-500 text-pink-600">
              💔 {neglectedRelationships.length} neglected bonds
            </Badge>
          )}
          {cats.length > 0 &&
            sickCats.length === 0 &&
            tiredCats.length === 0 &&
            unhappyCats.length === 0 &&
            neglectedRelationships.length === 0 && (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                ✨ All cats are happy & healthy!
              </Badge>
            )}
        </div>

        {/* Bulk Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onHealAll}
            disabled={!canHealAll}
            className="flex-col h-auto py-3 gap-1"
          >
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium">Heal All</span>
            {sickCats.length > 0 && (
              <span className="text-xs text-muted-foreground">💊 {medicineCost} medicine</span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRestAll}
            disabled={!canRestAll}
            className="flex-col h-auto py-3 gap-1"
          >
            <Moon className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">Rest All</span>
            <span className="text-xs text-muted-foreground">Free</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onComfortAll}
            disabled={!canComfortAll}
            className="flex-col h-auto py-3 gap-1"
          >
            <Smile className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Comfort All</span>
            <span className="text-xs text-muted-foreground">Free</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onTrainAll}
            disabled={!canTrainAll}
            className="flex-col h-auto py-3 gap-1"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium">Train All</span>
            {trainableCats.length > 0 && (
              <span className="text-xs text-muted-foreground">
                🍬{trainCost} 🎾{trainCost}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSocializeAll}
            disabled={!canSocializeAll}
            className="flex-col h-auto py-3 gap-1 col-span-2"
          >
            <HeartHandshake className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-medium">Socialize All Neglected</span>
            {neglectedRelationships.length > 0 && (
              <span className="text-xs text-muted-foreground">
                🍬 {socializeCost} treats • {neglectedRelationships.length} pairs
              </span>
            )}
          </Button>
        </div>

        {/* Multi-Select Sell Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Bulk Sell</span>
            <Button
              variant={selectMode ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelectedCats([]);
              }}
            >
              {selectMode ? 'Cancel' : 'Select Cats'}
            </Button>
          </div>

          {selectMode && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                  <CheckSquare className="h-3 w-3 mr-1" /> Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs">
                  <Square className="h-3 w-3 mr-1" /> Deselect All
                </Button>
              </div>

              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-1">
                  {cats.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedCats.includes(cat.id)}
                        onCheckedChange={() => toggleSelect(cat.id)}
                      />
                      <CatVisual cat={cat} size="xs" equippedCostumeId={catCostumes?.[cat.id]} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {BREEDS[cat.breed].name} • $
                          {Math.floor(cat.value * (1 + cat.showWins * 0.1))}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>

              {selectedCats.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full gap-2">
                      <Trash2 className="h-4 w-4" />
                      Sell {selectedCats.length} cats for ${totalSellValue}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Bulk Sell</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to sell {selectedCats.length} cats for a total of $
                        {totalSellValue}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSellSelected}>
                        Sell {selectedCats.length} Cats
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
