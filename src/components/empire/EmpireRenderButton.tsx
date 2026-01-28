import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMPIRE_RENDER_COST } from '@/hooks/useEmpireRender';

interface EmpireRenderButtonProps {
  canAfford: boolean;
  isRendering: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Animated button for triggering Empire AI render
 * Shows cost badge and loading state
 */
export function EmpireRenderButton({
  canAfford,
  isRendering,
  onClick,
  className,
}: EmpireRenderButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={canAfford ? 'default' : 'outline'}
        size="sm"
        disabled={!canAfford || isRendering}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'gap-2 transition-all duration-300',
          canAfford && !isRendering && 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90',
          isHovered && canAfford && !isRendering && 'scale-105 shadow-lg'
        )}
      >
        {isRendering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Rendering...</span>
          </>
        ) : (
          <>
            <Sparkles className={cn('h-4 w-4', isHovered && canAfford && 'animate-pulse')} />
            <span>Render Empire</span>
          </>
        )}
      </Button>
      
      {/* Cost badge */}
      <Badge
        variant={canAfford ? 'secondary' : 'destructive'}
        className={cn(
          'absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5',
          'transition-transform duration-200',
          isHovered && 'scale-110'
        )}
      >
        💰 {EMPIRE_RENDER_COST.toLocaleString()}
      </Badge>
    </div>
  );
}
