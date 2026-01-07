import { getGradeTier, getGradeStars, getGradeColor } from '@/types/grading';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

/**
 * Props for the GradeBadge component
 */
interface GradeBadgeProps {
  /** Cat grade value (1-20) */
  grade: number;
  /** Whether to show star indicators */
  showStars?: boolean;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * GradeBadge - Visual indicator for cat grade tier
 *
 * Displays the cat's grade with tier-specific styling and optional stars.
 * Tiers: common (1-4), uncommon (5-8), rare (9-12), veryRare (13-16), ultraRare (17-20).
 * Higher tiers have progressively fancier animations.
 *
 * @example
 * ```tsx
 * <GradeBadge grade={15} showStars size="md" />
 * ```
 */

export function GradeBadge({ grade, showStars = true, size = 'md' }: GradeBadgeProps) {
  const tier = getGradeTier(grade);
  const stars = getGradeStars(grade);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const tierStyles = {
    common: 'bg-gray-100 text-gray-600 border-gray-200',
    uncommon: 'bg-blue-100 text-blue-700 border-blue-200',
    rare: 'bg-purple-100 text-purple-700 border-purple-200 animate-glow-pulse [--grade-color:hsl(270,70%,60%)]',
    veryRare:
      'bg-yellow-100 text-yellow-700 border-yellow-300 animate-grade-glow [--grade-color:hsl(45,90%,50%)]',
    ultraRare:
      'bg-gradient-to-r from-purple-200 via-pink-200 to-red-200 text-transparent bg-clip-text animate-rainbow border-2',
  };

  const starColor = {
    common: 'text-gray-400',
    uncommon: 'text-blue-400',
    rare: 'text-purple-400',
    veryRare: 'text-yellow-400',
    ultraRare: 'text-pink-400',
  };

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses[size]} ${tierStyles[tier]} font-bold gap-1 inline-flex items-center`}
    >
      <span
        className={
          tier === 'ultraRare'
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent font-extrabold'
            : ''
        }
      >
        {grade}
      </span>
      {showStars && stars > 0 && (
        <span className="flex gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <Star
              key={i}
              className={`${size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'} ${starColor[tier]} fill-current ${tier === 'ultraRare' ? 'animate-star-spin' : ''}`}
            />
          ))}
        </span>
      )}
    </Badge>
  );
}
