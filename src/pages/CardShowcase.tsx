import { Cat } from '@/types/game';
import { UnifiedCatCard } from '@/components/game/UnifiedCatCard';
import { useTheme } from 'next-themes';
import { Sun, Moon, Sparkles } from 'lucide-react';
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

const TIER_INFO = [
  { label: 'Common', emoji: '🐾', desc: 'Your everyday companions', color: 'text-muted-foreground' },
  { label: 'Uncommon', emoji: '💎', desc: 'A step above the rest', color: 'text-blue-400' },
  { label: 'Rare', emoji: '🔮', desc: 'Crystalline amethyst glow', color: 'text-purple-400' },
  { label: 'Legendary', emoji: '👑', desc: 'Gilded metallic sheen', color: 'text-yellow-400' },
  { label: 'Mythic', emoji: '✨', desc: 'Holographic prismatic aura', color: 'text-pink-400' },
];

export default function CardShowcase() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(30_30%_96%)] via-background to-[hsl(30_20%_94%)] dark:from-[hsl(240_10%_8%)] dark:via-background dark:to-[hsl(260_10%_6%)] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Card Showcase
              </h1>
            </div>
            <p className="text-muted-foreground text-lg ml-14">
              Preview all tier styles — pick your favorite look
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl h-11 w-11 backdrop-blur-sm bg-card/60 border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Decorative paw prints */}
        <div className="relative">
          <div className="absolute -top-8 right-12 text-4xl opacity-10 animate-float pointer-events-none select-none" style={{ animationDuration: '6s' }}>🐾</div>
          <div className="absolute top-20 -left-4 text-3xl opacity-10 animate-float pointer-events-none select-none" style={{ animationDuration: '8s', animationDelay: '2s' }}>🐾</div>
        </div>

        {/* Standard Card Variant */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <h2 className="text-2xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Standard Cards
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent" />
          </div>

          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {MOCK_CATS.map((cat, i) => (
              <div
                key={cat.id}
                className="space-y-3 animate-fade-in"
                style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{TIER_INFO[i].emoji}</span>
                    <span className={`text-sm font-bold tracking-wide uppercase ${TIER_INFO[i].color}`}>
                      {TIER_INFO[i].label}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">
                    {TIER_INFO[i].desc}
                  </span>
                </div>
                <UnifiedCatCard cat={cat} variant="card" showStats showActions={false} />
              </div>
            ))}
          </div>
        </section>

        {/* Trading Card Variant */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <h2 className="text-2xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trading Cards
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent" />
          </div>

          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {MOCK_CATS.map((cat, i) => (
              <div
                key={`trading-${cat.id}`}
                className="space-y-3 animate-fade-in"
                style={{ animationDelay: `${700 + i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{TIER_INFO[i].emoji}</span>
                    <span className={`text-sm font-bold tracking-wide uppercase ${TIER_INFO[i].color}`}>
                      {TIER_INFO[i].label}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground italic">
                    Tap to flip
                  </span>
                </div>
                <UnifiedCatCard cat={cat} variant="trading" showFlip />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
