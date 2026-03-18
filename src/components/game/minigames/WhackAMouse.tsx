import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface WhackAMouseProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const HOLES = 9;
const GAME_DURATION = 12;

export function WhackAMouse({ onComplete, onSkip }: WhackAMouseProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [activeHoles, setActiveHoles] = useState<Set<number>>(new Set());
  const [whackedHole, setWhackedHole] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

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

  // Spawn mice
  useEffect(() => {
    if (!isActive) return;
    const spawn = () => {
      const count = 1 + (score > 5 ? 1 : 0);
      const holes = new Set<number>();
      while (holes.size < count) {
        holes.add(Math.floor(Math.random() * HOLES));
      }
      setActiveHoles(holes);
    };
    spawn();
    intervalRef.current = setInterval(spawn, 1000 - Math.min(score * 30, 400));
    return () => clearInterval(intervalRef.current);
  }, [isActive, score]);

  // Game over
  useEffect(() => {
    if (!isActive && timeLeft === 0) {
      const timeout = setTimeout(() => onComplete(score), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, timeLeft, score, onComplete]);

  const handleWhack = (hole: number) => {
    if (!isActive || !activeHoles.has(hole)) return;
    setScore((s) => s + 1);
    setWhackedHole(hole);
    setActiveHoles((prev) => {
      const next = new Set(prev);
      next.delete(hole);
      return next;
    });
    setTimeout(() => setWhackedHole(null), 300);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-primary">🐱 Whacked: {score}</span>
        <span className={`text-sm font-bold ${timeLeft <= 4 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      {isActive ? (
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {Array.from({ length: HOLES }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleWhack(i)}
              className={`
                relative w-full aspect-square rounded-xl border-2 flex items-center justify-center text-2xl
                transition-all duration-150 select-none
                ${activeHoles.has(i)
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 cursor-pointer'
                  : 'bg-secondary/50 border-border cursor-default'}
                ${whackedHole === i ? 'scale-90 bg-green-200 dark:bg-green-900/40 border-green-500' : ''}
              `}
            >
              {whackedHole === i ? (
                <span className="animate-ping text-xl">💥</span>
              ) : activeHoles.has(i) ? (
                <span className="animate-bounce" style={{ animationDuration: '0.6s' }}>🐭</span>
              ) : (
                <span className="text-lg opacity-30">🕳️</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 animate-fade-in">
          <span className="text-4xl mb-2">{score >= 10 ? '🏆' : score >= 6 ? '🎉' : '🐱'}</span>
          <span className="text-lg font-bold text-primary">
            {score >= 10 ? 'Mouse Master!' : score >= 6 ? 'Great reflexes!' : 'Nice try!'}
          </span>
          <span className="text-sm text-muted-foreground">Whacked {score} mice!</span>
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
