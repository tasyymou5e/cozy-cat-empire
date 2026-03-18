import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TreatTossProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

interface FallingTreat {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
}

const TREAT_EMOJIS = ['🐟', '🍗', '🥩', '🧀', '🍤'];

export function TreatToss({ onComplete, onSkip }: TreatTossProps) {
  const [bowlX, setBowlX] = useState(50);
  const [treats, setTreats] = useState<FallingTreat[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [isActive, setIsActive] = useState(true);
  const nextId = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

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

  // Spawn treats
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTreats((prev) => [
        ...prev,
        {
          id: nextId.current++,
          x: 5 + Math.random() * 90,
          y: -5,
          emoji: TREAT_EMOJIS[Math.floor(Math.random() * TREAT_EMOJIS.length)],
          speed: 1.5 + Math.random() * 1.5,
        },
      ]);
    }, 800);
    return () => clearInterval(interval);
  }, [isActive]);

  // Animate treats falling
  useEffect(() => {
    if (!isActive) return;
    const anim = setInterval(() => {
      setTreats((prev) => {
        const updated: FallingTreat[] = [];
        for (const t of prev) {
          const newY = t.y + t.speed;
          if (newY >= 85) {
            // Check catch
            if (Math.abs(t.x - bowlX) < 15) {
              setScore((s) => s + 1);
            } else {
              setMissed((m) => m + 1);
            }
          } else {
            updated.push({ ...t, y: newY });
          }
        }
        return updated;
      });
    }, 50);
    return () => clearInterval(anim);
  }, [isActive, bowlX]);

  // Game over
  useEffect(() => {
    if (!isActive && timeLeft === 0) {
      const timeout = setTimeout(() => onComplete(score), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, timeLeft, score, onComplete]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!areaRef.current || !isActive) return;
    const rect = areaRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setBowlX(Math.max(10, Math.min(90, pct)));
  }, [isActive]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-primary">🐟 Caught: {score}</span>
        <span className={`text-sm font-bold ${timeLeft <= 4 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <div
        ref={areaRef}
        className="relative w-full h-52 rounded-xl border-2 border-primary/20 bg-gradient-to-b from-accent/30 to-accent/10 overflow-hidden cursor-none touch-none select-none"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
      >
        {isActive ? (
          <>
            {/* Falling treats */}
            {treats.map((t) => (
              <span
                key={t.id}
                className="absolute text-2xl transition-none pointer-events-none"
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {t.emoji}
              </span>
            ))}

            {/* Cat bowl */}
            <div
              className="absolute bottom-1 transition-none"
              style={{ left: `${bowlX}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-3xl">🐱</span>
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-xl">🥣</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <span className="text-4xl mb-2">{score >= 8 ? '🏆' : score >= 5 ? '🎉' : '😸'}</span>
            <span className="text-lg font-bold text-primary">Caught {score} treats!</span>
            <span className="text-xs text-muted-foreground">Missed {missed}</span>
          </div>
        )}
      </div>

      {isActive && (
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
          Skip game
        </Button>
      )}
    </div>
  );
}
