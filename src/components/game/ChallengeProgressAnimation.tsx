import { useEffect, useState } from 'react';

interface ProgressAnimation {
  id: string;
  value: number;
  x: number;
  y: number;
}

interface ChallengeProgressAnimationProps {
  animations: ProgressAnimation[];
  onAnimationComplete: (id: string) => void;
}

export function ChallengeProgressAnimation({
  animations,
  onAnimationComplete,
}: ChallengeProgressAnimationProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {animations.map((anim) => (
        <FloatingNumber
          key={anim.id}
          animation={anim}
          onComplete={() => onAnimationComplete(anim.id)}
        />
      ))}
    </div>
  );
}

function FloatingNumber({
  animation,
  onComplete,
}: {
  animation: ProgressAnimation;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="absolute text-primary font-bold text-lg animate-progress-float"
      style={{
        left: animation.x,
        top: animation.y,
      }}
    >
      +{animation.value}
    </div>
  );
}

// Hook to manage progress animations
export function useProgressAnimations() {
  const [animations, setAnimations] = useState<ProgressAnimation[]>([]);

  const triggerAnimation = (value: number = 1) => {
    const id = `anim-${Date.now()}-${Math.random()}`;
    // Random position near center
    const x = 100 + Math.random() * 100;
    const y = 50 + Math.random() * 50;

    setAnimations((prev) => [...prev, { id, value, x, y }]);
  };

  const clearAnimation = (id: string) => {
    setAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  return { animations, triggerAnimation, clearAnimation };
}
