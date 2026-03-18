import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface MemoryMatchProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const CAT_EMOJIS = ['🐱', '😺', '😸', '🙀', '😻', '😽'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MemoryMatch({ onComplete, onSkip }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(true);

  // Init cards
  useEffect(() => {
    const emojis = shuffle(CAT_EMOJIS).slice(0, 6);
    const pairs = shuffle([...emojis, ...emojis].map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    })));
    setCards(pairs);
  }, []);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setIsActive(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Check for win
  useEffect(() => {
    if (matchCount === 6 && isActive) {
      setIsActive(false);
    }
  }, [matchCount, isActive]);

  // Game over
  useEffect(() => {
    if (!isActive) {
      const score = matchCount >= 6 ? Math.max(10 - moves + timeLeft, 5) : Math.floor(matchCount * 1.5);
      const timeout = setTimeout(() => onComplete(Math.min(score, 10)), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, matchCount, moves, timeLeft, onComplete]);

  const handleFlip = useCallback((id: number) => {
    if (!isActive || flippedIds.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      const c1 = cards.find((c) => c.id === first)!;
      const c2 = cards.find((c) => c.id === second)!;

      if (c1.emoji === (id === second ? c1.emoji : c2?.emoji) && c1.id !== id) {
        // Check match properly
        const card2 = cards.find((c) => c.id === id)!;
        if (c1.emoji === card2.emoji) {
          setTimeout(() => {
            setCards((prev) => prev.map((c) =>
              c.id === first || c.id === second ? { ...c, matched: true } : c
            ));
            setMatchCount((m) => m + 1);
            setFlippedIds([]);
          }, 500);
          return;
        }
      }

      setTimeout(() => {
        setCards((prev) => prev.map((c) =>
          newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c
        ));
        setFlippedIds([]);
      }, 800);
    }
  }, [isActive, flippedIds, cards]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-primary">🃏 Pairs: {matchCount}/6</span>
        <span className="text-xs text-muted-foreground">Moves: {moves}</span>
        <span className={`text-sm font-bold ${timeLeft <= 8 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {isActive ? (
        <div className="grid grid-cols-4 gap-1.5 w-full max-w-[260px]">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`
                aspect-square rounded-lg text-xl flex items-center justify-center
                transition-all duration-300 select-none border
                ${card.matched
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-400 scale-95'
                  : card.flipped
                  ? 'bg-primary/10 border-primary rotate-0'
                  : 'bg-secondary hover:bg-secondary/80 border-border cursor-pointer hover:scale-105'}
              `}
              disabled={card.matched || card.flipped}
            >
              {card.flipped || card.matched ? (
                <span className={card.matched ? 'opacity-60' : ''}>{card.emoji}</span>
              ) : (
                <span className="text-lg">🐾</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 animate-fade-in">
          <span className="text-4xl mb-2">{matchCount >= 6 ? '🏆' : '😸'}</span>
          <span className="text-lg font-bold text-primary">
            {matchCount >= 6 ? `All matched in ${moves} moves!` : `Matched ${matchCount}/6 pairs`}
          </span>
        </div>
      )}

      {isActive && (
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
          Skip game
        </Button>
      )}
    </div>
  );
}
