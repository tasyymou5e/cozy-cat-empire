/**
 * PortraitOutdatedBadge - Visual indicator for outdated cat portraits
 *
 * Shows a subtle badge when a cat's portrait no longer matches their current
 * appearance or costume. Clicking the badge triggers portrait regeneration.
 */

import React from 'react';
import { Cat } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PortraitOutdatedBadgeProps {
  /** The cat with outdated portrait */
  cat: Cat;
  /** Whether the portrait is outdated */
  isOutdated: boolean;
  /** Whether the cat has no portrait at all */
  hasNoPortrait?: boolean;
  /** Available credits for regeneration */
  creditsAvailable?: number;
  /** Callback when user clicks to regenerate */
  onRegenerate?: (catId: string) => void;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * PortraitOutdatedBadge component
 *
 * @example
 * ```tsx
 * <PortraitOutdatedBadge
 *   cat={myCat}
 *   isOutdated={true}
 *   creditsAvailable={5}
 *   onRegenerate={handleRegenerate}
 * />
 * ```
 */
export function PortraitOutdatedBadge({
  cat,
  isOutdated,
  hasNoPortrait = false,
  creditsAvailable = 0,
  onRegenerate,
  isRegenerating = false,
  size = 'sm',
  className,
}: PortraitOutdatedBadgeProps) {
  // Don't show if portrait is up to date
  if (!isOutdated && !hasNoPortrait) return null;

  const hasCredits = creditsAvailable >= 1;
  const isSmall = size === 'sm';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegenerate && hasCredits && !isRegenerating) {
      onRegenerate(cat.id);
    }
  };

  const tooltipContent = hasNoPortrait
    ? `${cat.name} has no AI portrait yet. Click to generate one.`
    : `${cat.name}'s appearance has changed. The portrait is outdated.`;

  const creditWarning = !hasCredits
    ? ' You need portrait credits to regenerate.'
    : ' Click to regenerate (1 credit).';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={!hasCredits || isRegenerating}
            className={cn(
              'h-auto p-0',
              isRegenerating && 'animate-pulse',
              className
            )}
          >
            <Badge
              variant="outline"
              className={cn(
                'gap-1 cursor-pointer transition-colors',
                hasNoPortrait
                  ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
                !hasCredits && 'opacity-60 cursor-not-allowed',
                isSmall ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
              )}
            >
              {isRegenerating ? (
                <RefreshCw className={cn('animate-spin', isSmall ? 'h-3 w-3' : 'h-4 w-4')} />
              ) : hasNoPortrait ? (
                <Sparkles className={cn(isSmall ? 'h-3 w-3' : 'h-4 w-4')} />
              ) : (
                <AlertTriangle className={cn(isSmall ? 'h-3 w-3' : 'h-4 w-4')} />
              )}
              {!isSmall && (hasNoPortrait ? 'Generate' : 'Update')}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">
            {tooltipContent}
            {onRegenerate && creditWarning}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PortraitOutdatedBadge;
