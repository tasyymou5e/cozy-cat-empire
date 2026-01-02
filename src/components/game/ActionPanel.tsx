import { Button } from '@/components/ui/button';
import { Cat } from '@/types/game';

interface ActionPanelProps {
  onAddCat: (type: Cat['type']) => void;
  onChores: () => void;
  onFeed: () => void;
  onCatShow: () => void;
  onUpgrade: () => void;
  onNextDay: () => void;
  money: number;
  catCount: number;
}

export function ActionPanel({
  onAddCat,
  onChores,
  onFeed,
  onCatShow,
  onUpgrade,
  onNextDay,
  money,
  catCount,
}: ActionPanelProps) {
  return (
    <div className="action-panel">
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-foreground">Add Cat</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onAddCat('stray')}
            className="flex flex-col h-auto py-2"
          >
            <span className="text-lg">🐱</span>
            <span className="text-xs">Stray</span>
            <span className="text-xs text-muted-foreground">Free</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onAddCat('adopted')}
            disabled={money < 20}
            className="flex flex-col h-auto py-2"
          >
            <span className="text-lg">😺</span>
            <span className="text-xs">Adopt</span>
            <span className="text-xs text-muted-foreground">$20</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onAddCat('pure')}
            disabled={money < 100}
            className="flex flex-col h-auto py-2"
          >
            <span className="text-lg">😻</span>
            <span className="text-xs">Pure</span>
            <span className="text-xs text-muted-foreground">$100</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-lg text-foreground">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onChores} className="action-button">
            🧹 Chores
          </Button>
          <Button 
            variant="outline" 
            onClick={onFeed}
            disabled={catCount === 0}
            className="action-button"
          >
            🍖 Feed (${catCount * 5})
          </Button>
          <Button 
            variant="outline" 
            onClick={onCatShow}
            disabled={catCount === 0}
            className="action-button"
          >
            🏆 Cat Show
          </Button>
          <Button variant="outline" onClick={onUpgrade} className="action-button">
            🏠 Upgrade
          </Button>
        </div>
      </div>

      <Button onClick={onNextDay} className="w-full next-day-button">
        ☀️ Next Day
      </Button>
    </div>
  );
}
