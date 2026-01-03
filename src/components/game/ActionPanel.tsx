import { Button } from '@/components/ui/button';
import { Cat, CAT_COSTS } from '@/types/game';

/**
 * Props for the ActionPanel component
 */
interface ActionPanelProps {
  /** Callback when adding a new cat */
  onAddCat: (type: Cat['type']) => void;
  /** Callback when advancing to the next day */
  onNextDay: () => void;
  /** Current money available */
  money: number;
  /** Maximum cat capacity */
  space: number;
  /** Current number of cats owned */
  catCount: number;
}

/**
 * ActionPanel - Primary actions for acquiring cats and advancing time
 * 
 * Provides buttons for getting new cats (stray, adopted, pure breed)
 * and advancing to the next day. Shows cost and availability.
 * 
 * @example
 * ```tsx
 * <ActionPanel
 *   onAddCat={handleAddCat}
 *   onNextDay={handleNextDay}
 *   money={150}
 *   space={5}
 *   catCount={2}
 * />
 * ```
 */

export function ActionPanel({
  onAddCat,
  onNextDay,
  money,
  space,
  catCount,
}: ActionPanelProps) {
  const hasSpace = catCount < space;

  return (
    <div className="action-panel">
      <div className="space-y-3">
        <h3 className="font-bold text-lg">🐾 Get New Cat</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="secondary" 
            onClick={() => onAddCat('stray')}
            disabled={!hasSpace}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-2xl">🐱</span>
            <span className="text-xs font-semibold">Stray</span>
            <span className="text-xs text-muted-foreground">Free</span>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => onAddCat('adopted')}
            disabled={money < CAT_COSTS.adopted || !hasSpace}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-2xl">😺</span>
            <span className="text-xs font-semibold">Adopt</span>
            <span className="text-xs text-muted-foreground">${CAT_COSTS.adopted}</span>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => onAddCat('pure')}
            disabled={money < CAT_COSTS.pure || !hasSpace}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-2xl">😻</span>
            <span className="text-xs font-semibold">Pure</span>
            <span className="text-xs text-muted-foreground">${CAT_COSTS.pure}</span>
          </Button>
        </div>
        {!hasSpace && (
          <p className="text-xs text-destructive text-center">No space! Upgrade home.</p>
        )}
      </div>

      <Button onClick={onNextDay} className="next-day-button">
        ☀️ Next Day
      </Button>
    </div>
  );
}
