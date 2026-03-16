import { Cat } from '@/types/game';
import { UnifiedCatCard } from '@/components/game/UnifiedCatCard';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MOCK_CATS: Cat[] = [
  {
    id: 'showcase-common',
    type: 'stray',
    breed: 'stray',
    name: 'Scrappy',
    health: 72,
    happiness: 55,
    hunger: 40,
    value: 30,
    age: 12,
    personality: 'curious',
    showWins: 0,
    isForSale: false,
    grade: 3,
    tricksLearned: [],
    trickProgress: { sit: 30, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 65,
    feedingScore: 20,
    lastTrainingDay: 0,
  },
  {
    id: 'showcase-uncommon',
    type: 'adopted',
    breed: 'tabby',
    name: 'Marble',
    health: 85,
    happiness: 70,
    hunger: 60,
    value: 80,
    age: 30,
    personality: 'playful',
    showWins: 3,
    isForSale: false,
    grade: 9,
    tricksLearned: ['sit'],
    trickProgress: { sit: 100, paw: 45, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 80,
    feedingScore: 55,
    lastTrainingDay: 0,
  },
  {
    id: 'showcase-rare',
    type: 'pure',
    breed: 'persian',
    name: 'Duchess',
    health: 90,
    happiness: 82,
    hunger: 75,
    value: 200,
    age: 45,
    personality: 'affectionate',
    showWins: 8,
    isForSale: false,
    grade: 15,
    tricksLearned: ['sit', 'paw', 'rollOver'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 60, fetch: 0 },
    restLevel: 90,
    feedingScore: 80,
    lastTrainingDay: 0,
  },
  {
    id: 'showcase-veryrare',
    type: 'pure',
    breed: 'bengal',
    name: 'Rajah',
    health: 95,
    happiness: 90,
    hunger: 85,
    value: 350,
    age: 60,
    personality: 'independent',
    showWins: 18,
    isForSale: false,
    grade: 18,
    tricksLearned: ['sit', 'paw', 'rollOver', 'jump'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 100, fetch: 70 },
    restLevel: 95,
    feedingScore: 95,
    lastTrainingDay: 0,
  },
  {
    id: 'showcase-ultrarare',
    type: 'pure',
    breed: 'ragdoll',
    name: 'Celestia',
    health: 100,
    happiness: 100,
    hunger: 95,
    value: 500,
    age: 90,
    personality: 'affectionate',
    showWins: 35,
    isForSale: false,
    grade: 20,
    tricksLearned: ['sit', 'paw', 'rollOver', 'jump', 'fetch'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 100, fetch: 100 },
    restLevel: 100,
    feedingScore: 100,
    lastTrainingDay: 0,
  },
];

const TIER_LABELS = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'];

export default function CardShowcase() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🐱 Card Showcase</h1>
            <p className="text-muted-foreground mt-1">Preview all tier styles — pick your favorite look</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Standard Card Variant */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Standard Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {MOCK_CATS.map((cat, i) => (
            <div key={cat.id} className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">{TIER_LABELS[i]}</span>
              <UnifiedCatCard cat={cat} variant="card" showStats showActions={false} />
            </div>
          ))}
        </div>

        {/* Trading Card Variant */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Trading Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {MOCK_CATS.map((cat, i) => (
            <div key={`trading-${cat.id}`} className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">{TIER_LABELS[i]}</span>
              <UnifiedCatCard cat={cat} variant="trading" showFlip />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
