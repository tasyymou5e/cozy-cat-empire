import { useState } from 'react';
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
  const [animatingResource, setAnimatingResource] = useState<string | null>(null);

  const resourceItems = [
    { key: 'food' as const, emoji: '🍖', name: 'Food', current: resources.food },
    { key: 'medicine' as const, emoji: '💊', name: 'Medicine', current: resources.medicine },
    { key: 'toys' as const, emoji: '🎾', name: 'Toys', current: resources.toys },
    { key: 'treats' as const, emoji: '🍬', name: 'Treats', current: resources.treats },
  ];

  const handleBuyResource = (key: keyof GameState['resources'], cost: number) => {
    if (money >= cost) {
      setAnimatingResource(key);
      setTimeout(() => setAnimatingResource(null), 600);
    }
    onBuyResource(key, cost);
  };

  return (
    <div className="resource-panel">
      <h3 className="font-bold text-lg mb-3">📦 Supplies</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {resourceItems.map(item => (
          <div 
            key={item.key} 
            className={`resource-item flex flex-col gap-2 p-3 rounded-lg bg-accent/30 border border-border transition-all duration-300 ${
              animatingResource === item.key 
                ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20' 
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-2xl transition-transform duration-300 ${
                animatingResource === item.key ? 'scale-125' : ''
              }`}>
                {item.emoji}
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className={`font-bold text-lg transition-all duration-300 ${
                  animatingResource === item.key ? 'text-primary scale-110' : ''
                }`}>
                  {item.current}
                  {animatingResource === item.key && (
                    <span className="ml-1 text-sm text-green-500 animate-fade-in">+5</span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBuyResource(item.key, RESOURCE_COSTS[item.key])}
              disabled={money < RESOURCE_COSTS[item.key]}
              className="w-full text-sm h-9"
            >
              Buy +5 (${RESOURCE_COSTS[item.key]})
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
