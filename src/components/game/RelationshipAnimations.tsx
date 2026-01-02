import { useState, useEffect } from 'react';
import { RelationshipEvent } from '@/types/relationships';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface RelationshipAnimationsProps {
  events: RelationshipEvent[];
  lastEventId: string | null;
}

export function RelationshipAnimations({ events, lastEventId }: RelationshipAnimationsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    if (!lastEventId || events.length === 0) return;
    
    const latestEvent = events.find(e => e.id === lastEventId);
    if (!latestEvent) return;

    // Generate random positions for emojis
    const emojis = latestEvent.type === 'positive' 
      ? ['💕', '💚', '✨', '💖', '🥰']
      : latestEvent.type === 'negative'
      ? ['😾', '💔', '😤', '⚡', '💢']
      : ['😐', '🤔'];

    const newEmojis: FloatingEmoji[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `${lastEventId}-${i}`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 20 + Math.random() * 60, // 20-80% of screen width
      y: 30 + Math.random() * 40, // 30-70% of screen height
      type: latestEvent.type,
    }));

    setFloatingEmojis(prev => [...prev, ...newEmojis]);

    // Remove after animation completes
    const timer = setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => !e.id.startsWith(lastEventId)));
    }, 1500);

    return () => clearTimeout(timer);
  }, [lastEventId, events]);

  if (floatingEmojis.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-float-up text-3xl"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        >
          <span className={`inline-block ${emoji.type === 'positive' ? 'animate-heart-pop' : 'animate-shake'}`}>
            {emoji.emoji}
          </span>
        </div>
      ))}
    </div>
  );
}
