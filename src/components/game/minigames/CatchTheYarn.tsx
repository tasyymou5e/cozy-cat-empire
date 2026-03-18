import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface CatchTheYarnProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

export function CatchTheYarn({ onComplete, onSkip }: CatchTheYarnProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [yarnPos, setYarnPos] = useState({ x: 50, y: 50 });
  const [isActive, setIsActive] = useState(true);
  const [caught, setCaught] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const moveYarn = useCallback(() => {
    setYarnPos({
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    });
    setCaught(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsActive(false);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(moveYarn, 1200 - Math.min(score * 50, 600));
    return () => clearInterval(interval);
  }, [isActive, moveYarn, score]);

  useEffect(() => {
    if (!isActive && timeLeft === 0) {
      const timeout = setTimeout(() => onComplete(score), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, timeLeft, score, onComplete]);

  const handleCatch = () => {
    if (!isActive) return;
    setScore((s) => s + 1);
    setCaught(true);
    setTimeout(moveYarn, 300);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-primary">🧶 Catch: {score}</span>
        <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <div
        ref={areaRef}
        className="relative w-full h-48 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 overflow-hidden cursor-pointer select-none"
      >
        {isActive ? (
          <button
            onClick={handleCatch}
            className="absolute transition-all duration-300 ease-out text-3xl hover:scale-125 active:scale-90"
            style={{
              left: `${yarnPos.x}%`,
              top: `${yarnPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {caught ? '✨' : '🧶'}
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <span className="text-4xl mb-2">🎉</span>
            <span className="text-lg font-bold text-primary">
              {score >= 8 ? 'Purrfect!' : score >= 5 ? 'Great job!' : score >= 3 ? 'Not bad!' : 'Keep trying!'}
            </span>
            <span className="text-sm text-muted-foreground">Caught {score} yarn balls!</span>
          </div>
        )}

        {/* Decorative paw prints */}
        {isActive && (
          <>
            <span className="absolute top-2 left-3 text-lg opacity-20 rotate-12">🐾</span>
            <span className="absolute bottom-3 right-4 text-lg opacity-20 -rotate-12">🐾</span>
          </>
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
