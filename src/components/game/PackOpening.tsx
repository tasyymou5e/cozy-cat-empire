import React, { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import { PokemonCard } from './PokemonCard';
import { useSound } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';
import { getGradeTier } from '@/types/grading';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PackOpeningProps {
  availableCats: Cat[];
  catCostumes?: Record<string, string>;
  packSize?: number;
  onPackOpened?: (cats: Cat[]) => void;
}

type Phase = 'idle' | 'shake' | 'tear' | 'reveal' | 'done';

export function PackOpening({ availableCats, packSize = 3, onPackOpened }: PackOpeningProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealedCards, setRevealedCards] = useState<Cat[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const { playSound } = useSound();

  const pickRandomCards = useCallback(() => {
    const shuffled = [...availableCats].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(packSize, shuffled.length));
  }, [availableCats, packSize]);

  const startOpening = () => {
    const cards = pickRandomCards();
    setRevealedCards(cards);
    setCurrentRevealIndex(-1);
    setPhase('shake');
    playSound('click');

    setTimeout(() => {
      setPhase('tear');
      playSound('success');
    }, 800);

    setTimeout(() => {
      setPhase('reveal');
      revealCardsSequentially(cards);
    }, 1600);
  };

  const revealCardsSequentially = (cards: Cat[]) => {
    cards.forEach((_, i) => {
      setTimeout(() => {
        setCurrentRevealIndex(i);
        playSound('cardFlip');
        const tier = getGradeTier(cards[i].grade);
        if (tier === 'veryRare' || tier === 'ultraRare') {
          playSound('achievement');
        }
      }, i * 600);
    });

    setTimeout(() => {
      setPhase('done');
      onPackOpened?.(cards);
    }, cards.length * 600 + 400);
  };

  const reset = () => {
    setPhase('idle');
    setRevealedCards([]);
    setCurrentRevealIndex(-1);
  };

  const bestTier = revealedCards.length > 0
    ? Math.max(...revealedCards.map(c => c.grade))
    : 0;

  return (
    <div className="space-y-6">
      {/* Pack */}
      {(phase === 'idle' || phase === 'shake' || phase === 'tear') && (
        <div className="flex justify-center">
          <div
            className={cn(
              'relative w-[220px] h-[300px] rounded-2xl overflow-hidden cursor-pointer transition-transform',
              phase === 'shake' && 'animate-pack-shake',
              phase === 'tear' && 'animate-pack-tear',
              phase === 'idle' && 'hover:scale-105'
            )}
            onClick={phase === 'idle' ? startOpening : undefined}
            style={{
              background: 'linear-gradient(135deg, hsl(270 60% 30%), hsl(280 70% 20%), hsl(260 50% 15%))',
              boxShadow: '0 0 40px hsl(270 70% 50% / 0.3), inset 0 0 60px hsl(270 50% 10% / 0.5)',
            }}
          >
            {/* Pack design */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
              <div className="text-5xl">🐱</div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider text-center">
                Cat Card Pack
              </h3>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">{packSize} cards inside</p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Sparkles key={i} className="h-3 w-3 text-yellow-400/60" />
                ))}
              </div>
            </div>

            {/* Shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(110deg, transparent 25%, hsl(270 80% 70% / 0.15) 50%, transparent 75%)',
                animation: phase === 'idle' ? 'shimmer 3s ease-in-out infinite' : undefined,
              }}
            />

            {/* Tear line */}
            {phase === 'tear' && (
              <div className="absolute inset-x-0 top-1/3 h-1 bg-white/80 animate-pack-tear-line" />
            )}

            {phase === 'idle' && (
              <div className="absolute bottom-4 inset-x-0 text-center">
                <span className="text-xs text-white/60 font-semibold animate-pulse">Tap to Open</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revealed cards */}
      {(phase === 'reveal' || phase === 'done') && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 animate-fade-in">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h3 className="text-xl font-extrabold text-foreground">
              {phase === 'done' ? 'Pack Opened!' : 'Revealing...'}
            </h3>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>

          <div className="flex justify-center gap-6 flex-wrap">
            {revealedCards.map((cat, i) => {
              const isRevealed = i <= currentRevealIndex;
              return (
                <div
                  key={cat.id}
                  className={cn(
                    'transition-all duration-500',
                    isRevealed
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-12 scale-90'
                  )}
                  style={{
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <PokemonCard cat={cat} showFlip={isRevealed} />
                </div>
              );
            })}
          </div>

          {phase === 'done' && (
            <div className="flex justify-center animate-fade-in">
              <Button onClick={reset} size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Open Another Pack
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Open button when idle */}
      {phase === 'idle' && (
        <div className="flex justify-center">
          <Button onClick={startOpening} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Open Pack ({packSize} Cards)
          </Button>
        </div>
      )}
    </div>
  );
}
