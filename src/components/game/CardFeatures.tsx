import React, { useState, useMemo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { getGradeTier, getGradeStars } from '@/types/grading';
import { getBreedType } from '@/config/breedTypes';
import { generateMoves } from '@/lib/cardMoves';
import { CatVisual } from './CatVisual';
import { PokemonCard } from './PokemonCard';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Crown, Minus, Plus, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ============================================================================
// Card Comparison Mode
// ============================================================================

interface CardComparisonProps {
  cats: Cat[];
  catCostumes?: Record<string, string>;
  onClose?: () => void;
}

interface StatComparison {
  label: string;
  emoji: string;
  key: keyof Cat;
  max: number;
}

const COMPARE_STATS: StatComparison[] = [
  { label: 'Health', emoji: '❤️', key: 'health', max: 100 },
  { label: 'Happiness', emoji: '😊', key: 'happiness', max: 100 },
  { label: 'Hunger', emoji: '🍗', key: 'hunger', max: 100 },
  { label: 'Rest', emoji: '💤', key: 'restLevel', max: 100 },
  { label: 'Grade', emoji: '⭐', key: 'grade', max: 20 },
  { label: 'Show Wins', emoji: '🏆', key: 'showWins', max: 50 },
  { label: 'Value', emoji: '💰', key: 'value', max: 500 },
  { label: 'Tricks', emoji: '🎯', key: 'tricksLearned', max: 5 },
];

export function CardComparison({ cats, catCostumes = {}, onClose }: CardComparisonProps) {
  const compareCats = cats.slice(0, 3);

  const getStatValue = (cat: Cat, stat: StatComparison): number => {
    if (stat.key === 'tricksLearned') return (cat.tricksLearned as string[]).length;
    return cat[stat.key] as number;
  };

  const getWinner = (stat: StatComparison): string | null => {
    if (compareCats.length < 2) return null;
    const values = compareCats.map(c => getStatValue(c, stat));
    const max = Math.max(...values);
    const winners = values.filter(v => v === max);
    if (winners.length === values.length) return null; // tie
    return compareCats[values.indexOf(max)].id;
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Card Comparison</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Cat headers */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${compareCats.length}, 1fr)` }}>
        <div />
        {compareCats.map(cat => {
          return (
            <div key={cat.id} className="flex flex-col items-center">
              <div className="transform scale-[0.35] origin-top -mb-[160px]">
                <PokemonCard cat={cat} equippedCostumeId={catCostumes[cat.id]} showFlip={false} isOwned />
              </div>
              <h4 className="font-bold text-sm truncate mt-2">{cat.name}</h4>
            </div>
          );
        })}

        {/* Stats rows */}
        {COMPARE_STATS.map(stat => {
          const winnerId = getWinner(stat);
          return (
            <React.Fragment key={stat.label}>
              <div className="flex items-center gap-2 text-sm font-medium py-2">
                <span>{stat.emoji}</span>
                <span>{stat.label}</span>
              </div>
              {compareCats.map(cat => {
                const value = getStatValue(cat, stat);
                const isWinner = winnerId === cat.id;
                const pct = (value / stat.max) * 100;
                return (
                  <div key={cat.id} className={cn(
                    'flex flex-col items-center justify-center py-2 rounded-lg transition-colors',
                    isWinner && 'bg-primary/10'
                  )}>
                    <span className={cn(
                      'text-lg font-extrabold',
                      isWinner ? 'text-primary' : 'text-foreground'
                    )}>
                      {stat.key === 'value' ? `$${value}` : value}
                      {isWinner && <Crown className="inline h-3 w-3 ml-1 text-primary" />}
                    </span>
                    <div className="w-full max-w-[80px] mt-1">
                      <Progress value={Math.min(pct, 100)} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Overall winner */}
        <div className="col-span-full border-t mt-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-foreground">
              Overall: {(() => {
                const scores = compareCats.map(cat =>
                  COMPARE_STATS.reduce((acc, stat) => {
                    const winnerId = getWinner(stat);
                    return acc + (winnerId === cat.id ? 1 : 0);
                  }, 0)
                );
                const maxScore = Math.max(...scores);
                const winner = compareCats[scores.indexOf(maxScore)];
                return `${winner.name} wins ${maxScore}/${COMPARE_STATS.length} categories`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Deck Builder Interface
// ============================================================================

interface DeckBuilderProps {
  availableCats: Cat[];
  catCostumes?: Record<string, string>;
  maxDeckSize?: number;
  onDeckChange?: (deck: Cat[]) => void;
}

export function DeckBuilder({ availableCats, catCostumes = {}, maxDeckSize = 6, onDeckChange }: DeckBuilderProps) {
  const [deck, setDeck] = useState<Cat[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const addToDeck = (cat: Cat) => {
    if (deck.length >= maxDeckSize || deck.find(c => c.id === cat.id)) return;
    const newDeck = [...deck, cat];
    setDeck(newDeck);
    onDeckChange?.(newDeck);
  };

  const removeFromDeck = (catId: string) => {
    const newDeck = deck.filter(c => c.id !== catId);
    setDeck(newDeck);
    onDeckChange?.(newDeck);
  };

  // Calculate synergy
  const synergy = useMemo(() => {
    if (deck.length < 2) return { score: 0, types: new Set<string>(), bonuses: [] as string[] };

    const types = new Set(deck.map(c => getBreedType(c.breed).name));
    const bonuses: string[] = [];
    let score = 0;

    // Type diversity bonus
    if (types.size >= 3) {
      score += 20;
      bonuses.push(`🌈 Type Diversity (+20)`);
    }
    if (types.size >= 5) {
      score += 30;
      bonuses.push(`✨ Full Spectrum (+30)`);
    }

    // Grade synergy
    const avgGrade = deck.reduce((s, c) => s + c.grade, 0) / deck.length;
    if (avgGrade >= 15) {
      score += 25;
      bonuses.push(`👑 Elite Squad (+25)`);
    }

    // Personality balance
    const personalities = new Set(deck.map(c => c.personality));
    if (personalities.size >= 4) {
      score += 15;
      bonuses.push(`🎭 Balanced Team (+15)`);
    }

    // Trick coverage
    const allTricks = new Set(deck.flatMap(c => c.tricksLearned));
    if (allTricks.size >= 4) {
      score += 20;
      bonuses.push(`🎯 Trick Masters (+20)`);
    }

    // Total stats
    const totalHP = deck.reduce((s, c) => s + c.health, 0);
    score += Math.floor(totalHP / deck.length / 5);

    return { score, types, bonuses };
  }, [deck]);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">⚔️ Deck Builder</h3>
        <Badge variant="outline" className="text-sm">
          {deck.length}/{maxDeckSize} cards
        </Badge>
      </div>

      {/* Deck slots */}
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: maxDeckSize }).map((_, i) => {
          const cat = deck[i];
          return (
            <div
              key={i}
              className={cn(
                'aspect-[5/7] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer',
                cat
                  ? 'border-primary bg-primary/5'
                  : selectedSlot === i
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/30'
              )}
              onClick={() => {
                if (cat) removeFromDeck(cat.id);
                else setSelectedSlot(i);
              }}
            >
              {cat ? (
                <div className="text-center p-1 relative group">
                  <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden mb-1"
                    style={{ background: getBreedType(cat.breed).imageGradient }}
                  >
                    <CatVisual cat={cat} equippedCostumeId={catCostumes[cat.id]} size="sm" />
                  </div>
                  <p className="text-[9px] font-bold truncate w-full">{cat.name}</p>
                  <p className="text-[8px] text-muted-foreground">G{cat.grade}</p>
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center">
                      <Minus className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ) : (
                <Plus className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Synergy display */}
      {deck.length >= 2 && (
        <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Synergy Score</span>
            <span className={cn(
              'text-2xl font-extrabold',
              synergy.score >= 60 ? 'text-yellow-500' : synergy.score >= 30 ? 'text-primary' : 'text-muted-foreground'
            )}>
              {synergy.score}
            </span>
          </div>
          <div className="flex gap-1 mb-2">
            {[...synergy.types].map(type => (
              <Badge key={type} variant="secondary" className="text-[10px]">{type}</Badge>
            ))}
          </div>
          {synergy.bonuses.length > 0 && (
            <div className="space-y-1">
              {synergy.bonuses.map((b, i) => (
                <p key={i} className="text-xs text-muted-foreground">{b}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available cats */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Available Cats</h4>
        <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
          {availableCats.filter(c => !deck.find(d => d.id === c.id)).map(cat => (
            <button
              key={cat.id}
              className="flex flex-col items-center p-2 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => addToDeck(cat)}
              disabled={deck.length >= maxDeckSize}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden mb-1"
                style={{ background: getBreedType(cat.breed).imageGradient }}
              >
                <CatVisual cat={cat} size="sm" />
              </div>
              <span className="text-[9px] font-bold truncate w-full text-center">{cat.name}</span>
              <span className="text-[8px] text-muted-foreground">G{cat.grade}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trading Animation
// ============================================================================

interface TradeAnimationProps {
  sendCat: Cat;
  receiveCat: Cat;
  sendCostumeId?: string;
  receiveCostumeId?: string;
  isPlaying: boolean;
  onComplete?: () => void;
}

export function TradeAnimation({ sendCat, receiveCat, sendCostumeId, receiveCostumeId, isPlaying, onComplete }: TradeAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'slide-out' | 'swap' | 'slide-in' | 'done'>('idle');

  React.useEffect(() => {
    if (!isPlaying) {
      setPhase('idle');
      return;
    }
    setPhase('slide-out');
    const t1 = setTimeout(() => setPhase('swap'), 600);
    const t2 = setTimeout(() => setPhase('slide-in'), 1200);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isPlaying, onComplete]);

  const sendType = getBreedType(sendCat.breed);
  const receiveType = getBreedType(receiveCat.breed);

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl border bg-gradient-to-r from-card via-muted/30 to-card">
      {/* Center swap icon */}
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-500',
        phase === 'swap' ? 'scale-125 rotate-180 opacity-100' : 'scale-75 opacity-40'
      )}>
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/30">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Sparkle particles during swap */}
      {(phase === 'swap' || phase === 'slide-in') && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-sm animate-sparkle"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s',
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      {/* Left card (sending) */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 transition-all duration-600 ease-in-out',
          phase === 'idle' ? 'left-[5%]' :
          phase === 'slide-out' ? 'left-[50%] -translate-x-1/2 opacity-0 scale-75' :
          phase === 'swap' ? 'left-[70%] -translate-x-full opacity-0 scale-50' :
          'left-[70%] -translate-x-full opacity-100 scale-100'
        )}
        style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="transform scale-[0.28] origin-top-left">
          <PokemonCard
            cat={phase === 'slide-in' || phase === 'done' ? receiveCat : sendCat}
            equippedCostumeId={phase === 'slide-in' || phase === 'done' ? receiveCostumeId : sendCostumeId}
            showFlip={false}
            isOwned
          />
        </div>
      </div>

      {/* Right card (receiving) */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 transition-all duration-600 ease-in-out',
          phase === 'idle' ? 'right-[5%]' :
          phase === 'slide-out' ? 'right-[50%] translate-x-1/2 opacity-0 scale-75' :
          phase === 'swap' ? 'right-[70%] translate-x-full opacity-0 scale-50' :
          'right-[70%] translate-x-full opacity-100 scale-100'
        )}
        style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="transform scale-[0.28] origin-top-right">
          <PokemonCard
            cat={phase === 'slide-in' || phase === 'done' ? sendCat : receiveCat}
            showFlip={false}
            isOwned
          />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-4 text-[10px] text-muted-foreground font-semibold">
        {phase === 'done' ? '✅ Trade Complete!' : 'You send'}
      </div>
      <div className="absolute bottom-2 right-4 text-[10px] text-muted-foreground font-semibold">
        {phase === 'done' ? '' : 'You receive'}
      </div>
    </div>
  );
}
