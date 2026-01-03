import { CatReaction } from '@/contexts/CatReactionContext';

interface CatCardReactionProps {
  reaction: CatReaction;
}

const BURST_POSITIONS = [
  { x: -20, y: -25 },
  { x: 25, y: -20 },
  { x: -15, y: 20 },
  { x: 20, y: 15 },
];

export function CatCardReaction({ reaction }: CatCardReactionProps) {
  const burstEmojis = reaction.type === 'positive' 
    ? ['💗', '💖', '✨', '💕']
    : reaction.type === 'negative'
    ? ['💢', '⚡', '💔', '😾']
    : ['❓', '💭'];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
      {/* Main emoji - top right corner */}
      <div 
        className="absolute -top-2 -right-2 animate-emoji-pop"
        style={{ fontSize: '2rem' }}
      >
        <span className={`inline-block ${reaction.type === 'negative' ? 'animate-emoji-shake' : 'animate-emoji-wiggle'}`}>
          {reaction.emoji}
        </span>
      </div>

      {/* Burst emojis */}
      {BURST_POSITIONS.slice(0, reaction.type === 'neutral' ? 2 : 4).map((pos, i) => (
        <div
          key={i}
          className="absolute top-0 right-0 animate-emoji-burst"
          style={{
            '--burst-x': `${pos.x}px`,
            '--burst-y': `${pos.y}px`,
            animationDelay: `${i * 0.05}s`,
            fontSize: '0.875rem',
          } as React.CSSProperties}
        >
          {burstEmojis[i % burstEmojis.length]}
        </div>
      ))}
    </div>
  );
}
