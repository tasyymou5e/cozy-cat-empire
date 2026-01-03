import { cn } from "@/lib/utils";

interface FloatingDecorationsProps {
  variant?: 'paws' | 'hearts' | 'stars';
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
    stars: ['✨', '⭐', '💫']
  };

  const items = decorations[variant];
  const count = density === 'low' ? 3 : density === 'medium' ? 5 : 8;

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl opacity-20 animate-float"
          style={{
            left: `${10 + (i * 25) % 80}%`,
            top: `${15 + (i * 30) % 70}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + (i % 3)}s`
          }}
        >
          {items[i % items.length]}
        </span>
      ))}
    </div>
  );
}
