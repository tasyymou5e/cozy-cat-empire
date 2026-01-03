import { useState, useEffect, useMemo } from 'react';
import { RelationshipEvent } from '@/types/relationships';
import { HeartParticles, SparkParticles, InteractionBubble, EdgeGlow } from './RelationshipParticles';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface InteractionNotification {
  id: string;
  catName1: string;
  catName2: string;
  message: string;
  scoreChange: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface ParticleEffect {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  x: number;
  y: number;
}

interface RelationshipAnimationsProps {
  events: RelationshipEvent[];
  lastEventId: string | null;
}

export function RelationshipAnimations({ events, lastEventId }: RelationshipAnimationsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [notifications, setNotifications] = useState<InteractionNotification[]>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [showGlow, setShowGlow] = useState<'positive' | 'negative' | 'neutral' | null>(null);

  useEffect(() => {
    if (!lastEventId || events.length === 0) return;
    
    const latestEvent = events.find(e => e.id === lastEventId);
    if (!latestEvent) return;

    // Add notification bubble
    setNotifications(prev => [...prev, {
      id: lastEventId,
      catName1: latestEvent.catName1,
      catName2: latestEvent.catName2,
      message: latestEvent.message,
      scoreChange: latestEvent.scoreChange,
      type: latestEvent.type,
    }]);

    // Add particle effects
    setParticles(prev => [...prev, {
      id: lastEventId,
      type: latestEvent.type,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 30,
    }]);

    // Show edge glow
    setShowGlow(latestEvent.type);

    // Generate enhanced floating emojis
    const emojis = latestEvent.type === 'positive' 
      ? ['💕', '💚', '✨', '💖', '🥰', '💗', '💓', '💝']
      : latestEvent.type === 'negative'
      ? ['😾', '💔', '😤', '⚡', '💢', '😿', '🙀']
      : ['😐', '🤔', '😶'];

    const newEmojis: FloatingEmoji[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `${lastEventId}-${i}`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 15 + Math.random() * 70,
      y: 25 + Math.random() * 45,
      size: 0.8 + Math.random() * 0.8,
      delay: i * 0.08,
      type: latestEvent.type,
    }));

    setFloatingEmojis(prev => [...prev, ...newEmojis]);

    // Clear glow quickly
    const glowTimer = setTimeout(() => setShowGlow(null), 800);

    // Remove notifications after animation
    const notifTimer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== lastEventId));
    }, 3500);

    // Remove particles and emojis after animation completes
    const cleanupTimer = setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => !e.id.startsWith(lastEventId)));
      setParticles(prev => prev.filter(p => p.id !== lastEventId));
    }, 2500);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(notifTimer);
      clearTimeout(cleanupTimer);
    };
  }, [lastEventId, events]);

  if (floatingEmojis.length === 0 && notifications.length === 0 && particles.length === 0 && !showGlow) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Edge glow effect */}
      {showGlow && <EdgeGlow type={showGlow} />}

      {/* Notification bubbles */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 space-y-2 z-60">
        {notifications.map(notification => (
          <InteractionBubble key={notification.id} {...notification} />
        ))}
      </div>

      {/* Particle effects */}
      {particles.map(particle => (
        particle.type === 'positive' 
          ? <HeartParticles key={particle.id} x={particle.x} y={particle.y} />
          : particle.type === 'negative'
          ? <SparkParticles key={particle.id} x={particle.x} y={particle.y} />
          : null
      ))}

      {/* Enhanced floating emojis */}
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-float-up-enhanced"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            animationDelay: `${emoji.delay}s`,
            fontSize: `${emoji.size * 2}rem`,
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
