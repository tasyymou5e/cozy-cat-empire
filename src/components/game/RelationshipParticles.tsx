import { useMemo } from 'react';

interface HeartParticlesProps {
  x: number;
  y: number;
  count?: number;
}

interface SparkParticlesProps {
  x: number;
  y: number;
  count?: number;
}

interface InteractionBubbleProps {
  catName1: string;
  catName2: string;
  message: string;
  scoreChange: number;
  type: 'positive' | 'negative' | 'neutral';
}

export function HeartParticles({ x, y, count = 12 }: HeartParticlesProps) {
  const hearts = useMemo(() => {
    const heartEmojis = ['💕', '💖', '💗', '💝', '💓', '🥰', '✨'];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
      xSpread: (Math.random() - 0.5) * 120,
      delay: Math.random() * 0.4,
      size: 0.8 + Math.random() * 0.6,
      duration: 1.5 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-heart-cascade"
          style={
            {
              '--x-spread': `${heart.xSpread}px`,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              fontSize: `${heart.size * 1.5}rem`,
            } as React.CSSProperties
          }
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  );
}

export function SparkParticles({ x, y, count = 10 }: SparkParticlesProps) {
  const sparks = useMemo(() => {
    const sparkEmojis = ['⚡', '💢', '💥', '😾', '😤', '🔥'];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: sparkEmojis[Math.floor(Math.random() * sparkEmojis.length)],
      xSpread: (Math.random() - 0.5) * 100,
      ySpread: (Math.random() - 0.5) * 60,
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
      size: 0.7 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute animate-spark-burst"
          style={
            {
              '--x-spread': `${spark.xSpread}px`,
              '--y-spread': `${spark.ySpread}px`,
              '--rotation': `${spark.rotation}deg`,
              animationDelay: `${spark.delay}s`,
              fontSize: `${spark.size * 1.5}rem`,
            } as React.CSSProperties
          }
        >
          {spark.emoji}
        </div>
      ))}
    </div>
  );
}

export function InteractionBubble({
  catName1,
  catName2,
  message,
  scoreChange,
  type,
}: InteractionBubbleProps) {
  const borderColor =
    type === 'positive'
      ? 'border-green-500/50'
      : type === 'negative'
        ? 'border-destructive/50'
        : 'border-muted-foreground/50';

  const bgColor =
    type === 'positive'
      ? 'bg-green-500/10'
      : type === 'negative'
        ? 'bg-destructive/10'
        : 'bg-muted/50';

  const scoreColor =
    type === 'positive'
      ? 'text-green-500'
      : type === 'negative'
        ? 'text-destructive'
        : 'text-muted-foreground';

  const emoji = type === 'positive' ? '💚' : type === 'negative' ? '💔' : '😐';

  return (
    <div
      className={`
        animate-slide-in-top px-4 py-3 rounded-lg border-2 ${borderColor} ${bgColor}
        backdrop-blur-sm shadow-lg max-w-xs
      `}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{emoji}</span>
        <div className="flex-1">
          <div className="font-medium text-foreground">
            {catName1} & {catName2}
          </div>
          <div className="text-xs text-muted-foreground truncate">{message}</div>
        </div>
        <span className={`font-bold ${scoreColor}`}>
          {scoreChange > 0 ? '+' : ''}
          {scoreChange}
        </span>
      </div>
    </div>
  );
}

export function EdgeGlow({ type }: { type: 'positive' | 'negative' | 'neutral' }) {
  const glowColor =
    type === 'positive'
      ? 'from-pink-500/30 via-transparent to-transparent'
      : type === 'negative'
        ? 'from-orange-500/30 via-transparent to-transparent'
        : 'from-gray-500/20 via-transparent to-transparent';

  return (
    <div className="fixed inset-0 pointer-events-none animate-edge-glow">
      <div className={`absolute inset-0 bg-gradient-to-b ${glowColor}`} />
      <div className={`absolute inset-0 bg-gradient-to-t ${glowColor}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${glowColor}`} />
      <div className={`absolute inset-0 bg-gradient-to-l ${glowColor}`} />
    </div>
  );
}
