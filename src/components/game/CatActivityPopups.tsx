import { useState, useEffect } from 'react';
import { Cat } from '@/types/game';
import { useSound } from '@/contexts/SoundContext';
import { SoundType } from '@/hooks/useSoundEffects';

interface ActivityPopup {
  id: string;
  catName: string;
  activity: string;
  emoji: string;
  position: { top: string; left: string };
}

interface CatActivityPopupsProps {
  cats: Cat[];
}

const ACTIVITIES = [
  { key: 'eating', emojis: ['🍖', '🐟', '🍽️'], text: 'is eating' },
  { key: 'playing', emojis: ['🎾', '🧶', '🎮'], text: 'is playing' },
  { key: 'sleeping', emojis: ['💤', '😴', '🌙'], text: 'is napping' },
  { key: 'grooming', emojis: ['✨', '🛁', '🐾'], text: 'is grooming' },
  { key: 'exploring', emojis: ['🔍', '🗺️', '👀'], text: 'is exploring' },
  { key: 'hunting', emojis: ['🎯', '🐭', '🦋'], text: 'is hunting' },
  { key: 'stretching', emojis: ['🧘', '💪', '🌟'], text: 'is stretching' },
  { key: 'cuddling', emojis: ['💕', '🤗', '❤️'], text: 'is cuddling' },
  { key: 'training', emojis: ['🎓', '🏆', '📚'], text: 'is learning tricks' },
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
};

export function CatActivityPopups({ cats }: CatActivityPopupsProps) {
  const [popups, setPopups] = useState<ActivityPopup[]>([]);
  const [positionIndex, setPositionIndex] = useState(0);
  const { playSound } = useSound();

  useEffect(() => {
    if (cats.length === 0) return;

    const interval = setInterval(() => {
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      const randomActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      const randomEmoji = randomActivity.emojis[Math.floor(Math.random() * randomActivity.emojis.length)];

      const newPopup: ActivityPopup = {
        id: `${Date.now()}-${Math.random()}`,
        catName: randomCat.name,
        activity: randomActivity.text,
        emoji: randomEmoji,
        position: POSITIONS[positionIndex % POSITIONS.length],
      };

      setPositionIndex((prev) => prev + 1);
      setPopups((prev) => [...prev, newPopup]);

      // Play activity sound
      const soundType = ACTIVITY_SOUNDS[randomActivity.key];
      if (soundType) {
        playSound(soundType);
      }

      // Remove popup after 5 seconds
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 5000);
    }, 8000 + Math.random() * 4000); // Every 8-12 seconds

    return () => clearInterval(interval);
  }, [cats, positionIndex, playSound]);

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          className="fixed z-50 bg-card/95 border border-border rounded-xl shadow-lg p-3 animate-activity-popup pointer-events-none"
          style={{
            top: popup.position.top,
            left: popup.position.left,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <div>
              <p className="font-medium text-sm text-foreground">{popup.catName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-base">{popup.emoji}</span> {popup.activity}...
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
