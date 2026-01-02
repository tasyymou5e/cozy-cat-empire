import { useState, useEffect } from 'react';
import { Cat } from '@/types/game';

interface MoodEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  mood: 'happy' | 'sad' | 'angry' | 'sleepy' | 'hungry' | 'playful';
}

interface MoodAnimationsProps {
  cats: Cat[];
}

const moodEmojis: Record<string, string[]> = {
  happy: ['💖', '✨', '🌟', '💕', '😻'],
  sad: ['💧', '😿', '🥺', '💔'],
  angry: ['😾', '💢', '⚡', '🔥'],
  sleepy: ['💤', '😴', '🌙', '⭐'],
  hungry: ['🍖', '🐟', '🥩', '😋'],
  playful: ['🎾', '🧶', '🎮', '🎯', '🎪'],
};

function getCatMood(cat: Cat): 'happy' | 'sad' | 'angry' | 'sleepy' | 'hungry' | 'playful' | null {
  if (cat.happiness < 30) return 'sad';
  if (cat.happiness < 50 && cat.health < 50) return 'angry';
  if (cat.restLevel < 30) return 'sleepy';
  if (cat.hunger < 30) return 'hungry';
  if (cat.happiness > 80) return Math.random() > 0.5 ? 'happy' : 'playful';
  return null;
}

export function MoodAnimations({ cats }: MoodAnimationsProps) {
  const [moodEmojisState, setMoodEmojisState] = useState<MoodEmoji[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random cat to show mood
      const catWithMood = cats.find(cat => {
        const mood = getCatMood(cat);
        return mood !== null;
      });
      
      if (catWithMood && Math.random() > 0.7) {
        const mood = getCatMood(catWithMood)!;
        const emojisForMood = moodEmojis[mood];
        
        const newEmoji: MoodEmoji = {
          id: `${Date.now()}-${Math.random()}`,
          emoji: emojisForMood[Math.floor(Math.random() * emojisForMood.length)],
          x: 10 + Math.random() * 80, // 10-90% of width
          y: 20 + Math.random() * 60, // 20-80% of height
          mood,
        };
        
        setMoodEmojisState(prev => [...prev, newEmoji]);
        
        // Remove after animation
        setTimeout(() => {
          setMoodEmojisState(prev => prev.filter(e => e.id !== newEmoji.id));
        }, 2000);
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [cats]);

  if (moodEmojisState.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {moodEmojisState.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-mood-float text-2xl md:text-3xl"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
          }}
        >
          <span className={`
            inline-block
            ${emoji.mood === 'happy' || emoji.mood === 'playful' ? 'animate-bounce' : ''}
            ${emoji.mood === 'sad' ? 'animate-pulse opacity-70' : ''}
            ${emoji.mood === 'angry' ? 'animate-shake' : ''}
            ${emoji.mood === 'sleepy' ? 'animate-pulse' : ''}
            ${emoji.mood === 'hungry' ? 'animate-wiggle' : ''}
          `}>
            {emoji.emoji}
          </span>
        </div>
      ))}
    </div>
  );
}
