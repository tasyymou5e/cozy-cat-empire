import { cn } from "@/lib/utils";

interface FloatingDecorationsProps {
  variant?: 'paws' | 'hearts' | 'stars' | 'cats';
  density?: 'low' | 'medium' | 'high';
  className?: string;
}

export function FloatingDecorations({ 
  variant = 'paws',
  density = 'low',
  className 
}: FloatingDecorationsProps) {
  const decorations = {
    paws: ['🐾', '🐱', '🐾'],
    hearts: ['💕', '❤️', '💖'],
    stars: ['✨', '⭐', '💫'],
    cats: ['🐱', '😺', '😸', '😻', '🐾', '🧶', '🐟', '💜']
  };

  const items = decorations[variant];
  const count = density === 'low' ? 3 : density === 'medium' ? 6 : 10;
  const opacity = variant === 'cats' ? 'opacity-40' : 'opacity-20';

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "absolute animate-float",
            opacity,
            variant === 'cats' ? 'text-2xl md:text-3xl' : 'text-xl'
          )}
          style={{
            left: `${5 + (i * 23) % 85}%`,
            top: `${10 + (i * 27) % 75}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 4)}s`
          }}
        >
          {items[i % items.length]}
        </span>
      ))}
    </div>
  );
}
