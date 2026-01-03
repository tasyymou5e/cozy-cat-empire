import { useState, useEffect, useRef } from 'react';
import { Cat } from '@/types/game';
import { useSound } from '@/contexts/SoundContext';
import { SoundType } from '@/hooks/useSoundEffects';

interface ActivityPopup {
  id: string;
  catId: string;
  catName: string;
  activity: string;
  emoji: string;
  animation: string;
  position: { top: string; left: string };
}

interface CatActivityPopupsProps {
  cats: Cat[];
  onCatClick?: (catId: string) => void;
  onFeed?: (catId: string) => void;
  onComfort?: (catId: string) => void;
  onHeal?: (catId: string) => void;
  hasFood?: boolean;
  hasMedicine?: boolean;
}

const ACTIVITIES = [
  { key: 'eating', emojis: ['🍖', '🐟', '🍽️'], text: 'is eating', animation: 'animate-bounce-gentle' },
  { key: 'playing', emojis: ['🎾', '🧶', '🎮'], text: 'is playing', animation: 'animate-wiggle' },
  { key: 'sleeping', emojis: ['💤', '😴', '🌙'], text: 'is napping', animation: 'animate-cat-breathe' },
  { key: 'grooming', emojis: ['✨', '🛁', '🐾'], text: 'is grooming', animation: 'animate-sparkle' },
  { key: 'exploring', emojis: ['🔍', '🗺️', '👀'], text: 'is exploring', animation: 'animate-pulse' },
  { key: 'hunting', emojis: ['🎯', '🐭', '🦋'], text: 'is hunting', animation: 'animate-shake' },
  { key: 'stretching', emojis: ['🧘', '💪', '🌟'], text: 'is stretching', animation: 'animate-scale-in' },
  { key: 'cuddling', emojis: ['💕', '🤗', '❤️'], text: 'is cuddling', animation: 'animate-heart-pop' },
  { key: 'training', emojis: ['🎓', '🏆', '📚'], text: 'is learning tricks', animation: 'animate-progress-pop' },
  { key: 'mischief', emojis: ['😈', '🙀', '💥'], text: 'is being mischievous', animation: 'animate-shake' },
  { key: 'zoomies', emojis: ['💨', '🏃', '⚡'], text: 'has the zoomies!', animation: 'animate-zoomies' },
  { key: 'sunbathing', emojis: ['☀️', '😌', '🌞'], text: 'is sunbathing', animation: 'animate-glow-pulse' },
  { key: 'birdwatching', emojis: ['🐦', '👁️', '🪶'], text: 'is watching birds', animation: 'animate-eye-shimmer' },
];

const POSITIONS = [
  { top: '10%', left: '5%' },
  { top: '10%', left: '75%' },
  { top: '60%', left: '5%' },
  { top: '60%', left: '75%' },
];

const ACTIVITY_SOUNDS: Record<string, SoundType> = {
  'eating': 'catEating',
  'playing': 'catPlaying',
  'sleeping': 'catSleeping',
  'grooming': 'catGrooming',
  'exploring': 'catExploring',
  'hunting': 'catHunting',
  'stretching': 'catStretching',
  'cuddling': 'catCuddling',
  'training': 'catTraining',
  'mischief': 'catMischief',
  'zoomies': 'catZoomies',
  'sunbathing': 'catSunbathing',
  'birdwatching': 'catBirdwatching',
};

export function CatActivityPopups({ 
  cats, 
  onCatClick,
  onFeed,
  onComfort,
  onHeal,
  hasFood = false,
  hasMedicine = false,
}: CatActivityPopupsProps) {
  const [popups, setPopups] = useState<ActivityPopup[]>([]);
  const positionIndexRef = useRef(0);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const { playSound } = useSound();

  useEffect(() => {
    if (cats.length === 0) return;

    const interval = setInterval(() => {
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      const randomActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      const randomEmoji = randomActivity.emojis[Math.floor(Math.random() * randomActivity.emojis.length)];

      const newPopup: ActivityPopup = {
        id: `${Date.now()}-${Math.random()}`,
        catId: randomCat.id,
        catName: randomCat.name,
        activity: randomActivity.text,
        emoji: randomEmoji,
        animation: randomActivity.animation,
        position: POSITIONS[positionIndexRef.current % POSITIONS.length],
      };

      positionIndexRef.current += 1;
      setPopups((prev) => [...prev, newPopup]);

      // Play activity sound
      const soundType = ACTIVITY_SOUNDS[randomActivity.key];
      if (soundType) {
        playSound(soundType);
      }

      // Remove popup AFTER animation completes (5s animation + 200ms buffer)
      const timeoutId = setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
        timeoutsRef.current.delete(timeoutId);
      }, 5200);
      
      timeoutsRef.current.add(timeoutId);
    }, 8000 + Math.random() * 4000);

    return () => {
      clearInterval(interval);
      // Clear all pending timeouts on cleanup
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current.clear();
    };
  }, [cats, playSound]);

  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const dismissPopup = (e: React.MouseEvent, popupId: string) => {
    e.stopPropagation();
    setPopups((prev) => prev.filter((p) => p.id !== popupId));
  };

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          onClick={() => onCatClick?.(popup.catId)}
          className="fixed z-50 bg-card/95 border border-border rounded-xl shadow-lg p-3 animate-activity-popup cursor-pointer hover:scale-105 hover:bg-card transition-all duration-200"
          style={{
            top: popup.position.top,
            left: popup.position.left,
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={(e) => dismissPopup(e, popup.id)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-muted hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center text-xs text-muted-foreground transition-colors shadow-sm"
            title="Dismiss"
          >
            ✕
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${popup.animation}`}>🐱</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{popup.catName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={`text-base ${popup.animation}`}>{popup.emoji}</span> {popup.activity}...
              </p>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-1">
              <button
                onClick={(e) => handleQuickAction(e, () => onFeed?.(popup.catId))}
                className="p-1.5 hover:bg-accent rounded-lg text-base transition-colors disabled:opacity-40"
                title="Feed"
                disabled={!hasFood}
              >
                🍖
              </button>
              <button
                onClick={(e) => handleQuickAction(e, () => onComfort?.(popup.catId))}
                className="p-1.5 hover:bg-accent rounded-lg text-base transition-colors"
                title="Comfort"
              >
                💕
              </button>
              <button
                onClick={(e) => handleQuickAction(e, () => onHeal?.(popup.catId))}
                className="p-1.5 hover:bg-accent rounded-lg text-base transition-colors disabled:opacity-40"
                title="Heal"
                disabled={!hasMedicine}
              >
                💊
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
