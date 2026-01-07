import { cn } from '@/lib/utils';

/**
 * Props for the LoadingCat component
 */
interface LoadingCatProps {
  /** Size of the loading animation */
  size?: 'sm' | 'md' | 'lg';
  /** Loading text to display */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingCat - Cat-themed loading indicator
 *
 * Displays a bouncing cat emoji with paw prints and optional loading text.
 * Use as a fun loading state for cat-related content.
 *
 * @example
 * ```tsx
 * <LoadingCat size="lg" text="Loading your cats..." />
 * ```
 */

export function LoadingCat({ size = 'md', text = 'Loading...', className }: LoadingCatProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <span className={cn(sizeClasses[size], 'animate-bounce inline-block')}>🐱</span>
        {/* Paw prints that fade in */}
        <span className="absolute -bottom-2 -left-4 text-lg opacity-60 animate-fade-in-up animate-delay-100">
          🐾
        </span>
        <span className="absolute -bottom-2 -right-4 text-lg opacity-60 animate-fade-in-up animate-delay-300">
          🐾
        </span>
      </div>
      {text && <p className="text-muted-foreground text-sm animate-pulse">{text}</p>}
    </div>
  );
}
