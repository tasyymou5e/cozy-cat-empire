import { Button } from '@/components/ui/button';
import { Cat, CAT_COSTS } from '@/types/game';

interface ActionPanelProps {
  onAddCat: (type: Cat['type']) => void;
  onNextDay: () => void;
  money: number;
  space: number;
  catCount: number;
}

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
