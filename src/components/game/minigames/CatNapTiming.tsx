import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface CatNapTimingProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

export function CatNapTiming({ onComplete, onSkip }: CatNapTimingProps) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stopped, setStopped] = useState(false);
  const [score, setScore] = useState(0);
  const animRef = useRef<number>();
  const startRef = useRef(Date.now());

  const animate = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    // Oscillate 0-100 over ~2.5s, speed increases slightly
    const speed = 0.04 + elapsed * 0.000005;
    setProgress((p) => {
      let next = p + direction * speed * 16;
      if (next >= 100) { next = 100; setDirection(-1); }
      if (next <= 0) { next = 0; setDirection(1); }
      return next;
    });
    animRef.current = requestAnimationFrame(animate);
  }, [direction]);

  useEffect(() => {
    if (stopped) return;
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animate, stopped]);

  const handleTap = () => {
    if (stopped) return;
    setStopped(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Score based on how close to the sweet spot (75-85%)
    const distance = Math.abs(progress - 80);
    let s = 0;
    if (distance <= 5) s = 10;
    else if (distance <= 10) s = 8;
    else if (distance <= 20) s = 5;
    else if (distance <= 30) s = 3;
    else s = 1;
    setScore(s);

    setTimeout(() => onComplete(s), 2000);
  };

  const sweetSpotStart = 75;
  const sweetSpotEnd = 85;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <span className="text-2xl">😴</span>
        <p className="text-xs text-muted-foreground mt-1">Tap when the Zzz hits the sweet spot!</p>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-8 rounded-full bg-secondary overflow-hidden">
        {/* Sweet spot zone */}
        <div
          className="absolute h-full bg-green-400/30 border-x-2 border-green-500/50"
          style={{ left: `${sweetSpotStart}%`, width: `${sweetSpotEnd - sweetSpotStart}%` }}
        />
        <div className="absolute inset-y-0 flex items-center text-[10px] font-bold text-green-700 dark:text-green-300"
          style={{ left: `${sweetSpotStart + 2}%` }}>
          💤
        </div>

        {/* Moving indicator */}
        <div
          className="absolute top-0 h-full w-2 rounded-full bg-primary shadow-lg transition-none"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Sleeping cat */}
      <div className="relative">
        <span className="text-5xl">🐱</span>
        {!stopped && (
          <span
            className="absolute -top-3 -right-2 text-lg animate-bounce"
            style={{ animationDuration: '1.5s' }}
          >
            💤
          </span>
        )}
      </div>

      {!stopped ? (
        <div className="flex gap-2">
          <Button onClick={handleTap} className="px-8 font-bold animate-pulse">
            Tap! 💤
          </Button>
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
            Skip
          </Button>
        </div>
      ) : (
        <div className="text-center animate-fade-in">
          <span className="text-3xl">{score >= 8 ? '🌟' : score >= 5 ? '⭐' : '😿'}</span>
          <p className="text-sm font-bold text-primary mt-1">
            {score >= 8 ? 'Perfect nap!' : score >= 5 ? 'Cozy rest!' : 'Restless sleep...'}
          </p>
        </div>
      )}
    </div>
  );
}
