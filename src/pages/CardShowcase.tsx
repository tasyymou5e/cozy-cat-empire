import { useState, useMemo } from 'react';
import { Cat } from '@/types/game';
import { UnifiedCatCard } from '@/components/game/UnifiedCatCard';
import { PokemonCard } from '@/components/game/PokemonCard';
import { CardComparison, DeckBuilder, TradeAnimation } from '@/components/game/CardFeatures';
import { PackOpening } from '@/components/game/PackOpening';
import { useTheme } from 'next-themes';
import { Sun, Moon, Sparkles, ArrowLeftRight, Layers, Swords, Package, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const MOCK_CATS: Cat[] = [
  {
    id: 'showcase-common', type: 'stray', breed: 'stray', name: 'Scrappy',
    health: 72, happiness: 55, hunger: 40, value: 30, age: 12,
    personality: 'curious', showWins: 0, isForSale: false, grade: 3,
    tricksLearned: [], trickProgress: { sit: 30, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 65, feedingScore: 20, lastTrainingDay: 0,
  },
  {
    id: 'showcase-uncommon', type: 'adopted', breed: 'tabby', name: 'Marble',
    health: 85, happiness: 70, hunger: 60, value: 80, age: 30,
    personality: 'playful', showWins: 3, isForSale: false, grade: 9,
    tricksLearned: ['sit'], trickProgress: { sit: 100, paw: 45, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 80, feedingScore: 55, lastTrainingDay: 0,
  },
  {
    id: 'showcase-rare', type: 'pure', breed: 'persian', name: 'Duchess',
    health: 90, happiness: 82, hunger: 75, value: 200, age: 45,
    personality: 'affectionate', showWins: 8, isForSale: false, grade: 15,
    tricksLearned: ['sit', 'paw', 'rollOver'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 60, fetch: 0 },
    restLevel: 90, feedingScore: 80, lastTrainingDay: 0,
  },
  {
    id: 'showcase-legendary', type: 'pure', breed: 'bengal', name: 'Rajah',
    health: 95, happiness: 90, hunger: 85, value: 350, age: 60,
    personality: 'independent', showWins: 18, isForSale: false, grade: 18,
    tricksLearned: ['sit', 'paw', 'rollOver', 'jump'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 100, fetch: 70 },
    restLevel: 95, feedingScore: 95, lastTrainingDay: 0,
  },
  {
    id: 'showcase-mythic', type: 'pure', breed: 'ragdoll', name: 'Celestia',
    health: 100, happiness: 100, hunger: 95, value: 500, age: 90,
    personality: 'affectionate', showWins: 35, isForSale: false, grade: 20,
    tricksLearned: ['sit', 'paw', 'rollOver', 'jump', 'fetch'],
    trickProgress: { sit: 100, paw: 100, rollOver: 100, jump: 100, fetch: 100 },
    restLevel: 100, feedingScore: 100, lastTrainingDay: 0,
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
  const [isTrading, setIsTrading] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(
    new Set(['showcase-common', 'showcase-rare', 'showcase-mythic'])
  );

  const collectionStats = useMemo(() => ({
    owned: collectedIds.size,
    total: MOCK_CATS.length,
    pct: Math.round((collectedIds.size / MOCK_CATS.length) * 100),
  }), [collectedIds]);

  const handlePackOpened = (cats: Cat[]) => {
    setCollectedIds(prev => {
      const next = new Set(prev);
      cats.forEach(c => next.add(c.id));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Cat Empire Cards
              </h1>
            </div>
            <p className="text-muted-foreground text-lg ml-14">
              Cat Empire cards with QR codes, pack opening, collection tracking & more
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {collectionStats.owned}/{collectionStats.total} ({collectionStats.pct}%)
            </Badge>
            <Button
              variant="outline" size="icon"
              className="rounded-2xl h-11 w-11 backdrop-blur-sm bg-card/60 border-border/50"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pokemon" className="space-y-8">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="pokemon">🃏 Cards</TabsTrigger>
            <TabsTrigger value="collection"><BookOpen className="h-3 w-3 mr-1" />Collection</TabsTrigger>
            <TabsTrigger value="packs"><Package className="h-3 w-3 mr-1" />Packs</TabsTrigger>
            <TabsTrigger value="compare"><ArrowLeftRight className="h-3 w-3 mr-1" />Compare</TabsTrigger>
            <TabsTrigger value="deck"><Layers className="h-3 w-3 mr-1" />Deck</TabsTrigger>
            <TabsTrigger value="trade"><Swords className="h-3 w-3 mr-1" />Trade</TabsTrigger>
          </TabsList>

          {/* Cat Cards */}
          <TabsContent value="pokemon">
            <SectionHeader title="Cat Cards" delay={100} />
            <div className="grid gap-10 justify-items-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {MOCK_CATS.map((cat, i) => (
                <div key={cat.id} className="space-y-3 animate-fade-in" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'both' }}>
                  <TierLabel info={TIER_INFO[i]} />
                  <PokemonCard cat={cat} showFlip />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Collection (owned vs unowned) */}
          <TabsContent value="collection">
            <SectionHeader title="Collection" delay={100} />
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${collectionStats.pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-foreground">
                {collectionStats.owned}/{collectionStats.total}
              </span>
            </div>
            <div className="grid gap-10 justify-items-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {MOCK_CATS.map((cat, i) => {
                const owned = collectedIds.has(cat.id);
                return (
                  <div key={cat.id} className="space-y-3 animate-fade-in" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'both' }}>
                    <div className="flex items-center justify-between px-1">
                      <TierLabel info={TIER_INFO[i]} />
                      <Badge variant={owned ? 'default' : 'secondary'} className="text-[10px]">
                        {owned ? '✅ Owned' : '❌ Missing'}
                      </Badge>
                    </div>
                    <PokemonCard cat={cat} showFlip={owned} isOwned={owned} />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Pack Opening */}
          <TabsContent value="packs">
            <SectionHeader title="Pack Opening" delay={100} />
            <PackOpening
              availableCats={MOCK_CATS}
              packSize={3}
              onPackOpened={handlePackOpened}
            />
          </TabsContent>

          {/* Compare */}
          <TabsContent value="compare">
            <SectionHeader title="Card Comparison" delay={100} />
            <CardComparison cats={MOCK_CATS.slice(2, 5)} />
          </TabsContent>

          {/* Deck Builder */}
          <TabsContent value="deck">
            <SectionHeader title="Deck Builder" delay={100} />
            <DeckBuilder availableCats={MOCK_CATS} maxDeckSize={6} />
          </TabsContent>

          {/* Trade Animation */}
          <TabsContent value="trade">
            <SectionHeader title="Trade Animation" delay={100} />
            <div className="space-y-4">
              <TradeAnimation
                sendCat={MOCK_CATS[1]}
                receiveCat={MOCK_CATS[3]}
                isPlaying={isTrading}
                onComplete={() => setIsTrading(false)}
              />
              <div className="flex justify-center">
                <Button onClick={() => setIsTrading(true)} disabled={isTrading} size="lg">
                  {isTrading ? '⏳ Trading...' : '🔄 Play Trade Animation'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <div className="flex items-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <h2 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent" />
    </div>
  );
}

function TierLabel({ info }: { info: typeof TIER_INFO[number] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{info.emoji}</span>
      <span className={`text-sm font-bold tracking-wide uppercase ${info.color}`}>{info.label}</span>
      <span className="text-[11px] text-muted-foreground italic">{info.desc}</span>
    </div>
  );
}
