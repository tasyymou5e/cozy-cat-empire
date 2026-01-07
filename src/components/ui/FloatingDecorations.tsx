import { cn } from '@/lib/utils';

/**
 * Props for the FloatingDecorations component
 */
interface FloatingDecorationsProps {
  /** Type of decorative icons to display */
  variant?: 'paws' | 'hearts' | 'stars' | 'cats' | 'kawaii-cats';
  /** Number of decorations to show */
  density?: 'low' | 'medium' | 'high';
  /** Additional CSS classes */
  className?: string;
}

// Fixed positions around edges for kawaii-cats variant
const KAWAII_POSITIONS = [
  { left: '3%', top: '8%' },
  { right: '5%', top: '5%' },
  { left: '8%', top: '35%' },
  { right: '3%', top: '30%' },
  { left: '2%', bottom: '25%' },
  { right: '6%', bottom: '35%' },
  { left: '5%', bottom: '8%' },
  { right: '4%', bottom: '10%' },
  { left: '15%', top: '3%' },
  { right: '15%', bottom: '5%' },
];

const KAWAII_EMOJIS = ['😺', '😸', '😻', '🐱', '😽', '🙀', '😹', '❤️', '💕', '🐾'];

/**
 * FloatingDecorations - Floating emoji decorations overlay
 *
 * Renders floating, animated emoji icons as decorative elements.
 * Use as an overlay on pages for visual flair.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <FloatingDecorations variant="paws" density="low" className="opacity-20" />
 *   <MainContent />
 * </div>
 * ```
 */

export function FloatingDecorations({
  variant = 'paws',
  density = 'low',
  className,
}: FloatingDecorationsProps) {
  const decorations = {
    paws: ['🐾', '🐱', '🐾'],
    hearts: ['💕', '❤️', '💖'],
    stars: ['✨', '⭐', '💫'],
    cats: ['🐱', '😺', '😸', '😻', '🐾', '🧶', '🐟', '💜'],
    'kawaii-cats': KAWAII_EMOJIS,
  };

  // For kawaii-cats, use fixed edge positions
  if (variant === 'kawaii-cats') {
    const count = density === 'low' ? 6 : density === 'medium' ? 8 : 10;
    return (
      <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
        {KAWAII_POSITIONS.slice(0, count).map((pos, i) => (
          <span
            key={i}
            className="absolute animate-float text-3xl md:text-4xl opacity-70"
            style={{
              ...pos,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + (i % 3)}s`,
            }}
          >
            {KAWAII_EMOJIS[i % KAWAII_EMOJIS.length]}
          </span>
        ))}
      </div>
    );
  }

  const items = decorations[variant];
  const count = density === 'low' ? 3 : density === 'medium' ? 6 : 10;
  const opacity = variant === 'cats' ? 'opacity-40' : 'opacity-20';

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'absolute animate-float',
            opacity,
            variant === 'cats' ? 'text-2xl md:text-3xl' : 'text-xl'
          )}
          style={{
            left: `${5 + ((i * 23) % 85)}%`,
            top: `${10 + ((i * 27) % 75)}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 4)}s`,
          }}
        >
          {items[i % items.length]}
        </span>
      ))}
    </div>
  );
}
