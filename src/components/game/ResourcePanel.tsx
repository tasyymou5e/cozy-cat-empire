import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GameState, RESOURCE_COSTS } from '@/types/game';

/**
 * Props for the ResourcePanel component
 */
interface ResourcePanelProps {
  /** Current resource amounts */
  resources: GameState['resources'];
  /** Current money available */
  money: number;
  /** Number of cats (determines resource consumption) */
  catCount: number;
  /** Callback when buying a resource */
  onBuyResource: (resource: keyof GameState['resources'], cost: number) => void;
  /** Callback when feeding all cats */
  onFeedCats: () => void;
  /** Callback when using toys for playtime */
  onUseToys: () => void;
}

/**
 * ResourcePanel - Manage and purchase game resources
 *
 * Displays current supplies (food, medicine, toys, treats) with buy buttons.
 * Provides actions to feed all cats and initiate playtime. Shows animated
 * feedback when purchasing resources.
 *
 * @example
 * ```tsx
 * <ResourcePanel
 *   resources={{ food: 10, medicine: 2, toys: 3, treats: 5 }}
 *   money={150}
 *   catCount={3}
 *   onBuyResource={handleBuy}
 *   onFeedCats={handleFeed}
 *   onUseToys={handlePlay}
 * />
 * ```
 */

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
        {resourceItems.map((item) => (
          <div
            key={item.key}
            className={`resource-item transition-all duration-300 ${
              animatingResource === item.key
                ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20 shadow-lg'
                : 'hover:bg-accent/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl transition-transform duration-300 ${
                  animatingResource === item.key ? 'scale-125' : ''
                }`}
              >
                {item.emoji}
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p
                  className={`font-bold text-lg transition-all duration-300 ${
                    animatingResource === item.key ? 'text-primary scale-110' : ''
                  }`}
                >
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
