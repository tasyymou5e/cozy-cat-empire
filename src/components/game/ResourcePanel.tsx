import { Button } from '@/components/ui/button';
import { GameState, RESOURCE_COSTS } from '@/types/game';

interface ResourcePanelProps {
  resources: GameState['resources'];
  money: number;
  catCount: number;
  onBuyResource: (resource: keyof GameState['resources'], cost: number) => void;
  onFeedCats: () => void;
  onUseToys: () => void;
}

export function ResourcePanel({
  resources,
  money,
  catCount,
  onBuyResource,
  onFeedCats,
  onUseToys,
}: ResourcePanelProps) {
  const resourceItems = [
    { key: 'food' as const, emoji: '🍖', name: 'Food', current: resources.food },
    { key: 'medicine' as const, emoji: '💊', name: 'Medicine', current: resources.medicine },
    { key: 'toys' as const, emoji: '🎾', name: 'Toys', current: resources.toys },
    { key: 'treats' as const, emoji: '🍬', name: 'Treats', current: resources.treats },
  ];

  return (
    <div className="resource-panel">
      <h3 className="font-bold text-lg mb-3">📦 Supplies</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {resourceItems.map(item => (
          <div key={item.key} className="resource-item">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.emoji}</span>
              <div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="font-bold">{item.current}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBuyResource(item.key, RESOURCE_COSTS[item.key])}
              disabled={money < RESOURCE_COSTS[item.key]}
              className="text-xs h-7 px-2"
            >
              +5 (${RESOURCE_COSTS[item.key]})
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          variant="secondary"
          onClick={onFeedCats}
          disabled={catCount === 0 || resources.food < catCount}
          className="w-full justify-start"
        >
          🍖 Feed All Cats ({catCount} food needed)
        </Button>
        <Button
          variant="secondary"
          onClick={onUseToys}
          disabled={catCount === 0 || resources.toys < Math.ceil(catCount / 3)}
          className="w-full justify-start"
        >
          🎾 Playtime ({Math.ceil(catCount / 3)} toys needed)
        </Button>
      </div>
    </div>
  );
}
