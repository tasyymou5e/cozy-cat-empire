import { useMemo, useState } from 'react';
import { EmpireProp as EmpirePropType } from '@/types/empire';
import { cn } from '@/lib/utils';
import { getObjectParallaxTransform, MICRO_DEPTH_CONFIG } from '@/lib/parallaxDepth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmpirePropComponentProps {
  prop: EmpirePropType;
  onClick?: (propId: string) => void;
  isHighlighted?: boolean;
  parallaxOffset?: { x: number; y: number };
  enableMicroDepth?: boolean;
  catsNearby?: number;
  isBeingUsed?: boolean;
  isSummoning?: boolean;
}

/**
 * Get interaction description for tooltip
 */
function getInteractionDescription(onInteract?: EmpirePropType['onInteract']): string {
  switch (onInteract) {
    case 'sleep': return 'Cats love to nap here';
    case 'play': return 'A fun spot for playful cats';
    case 'perch': return 'Great for watching and perching';
    case 'hide': return 'A cozy hiding spot';
    default: return '';
  }
}

/**
 * Get prop-specific animation class
 */
function getPropAnimation(propId: string, isBeingUsed: boolean): string {
  if (!isBeingUsed) return '';
  
  // Different animations for different prop types
  if (propId.includes('tree') || propId.includes('plant')) return 'animate-sway';
  if (propId.includes('bed') || propId.includes('cushion') || propId.includes('chaise')) return 'animate-pulse-slow';
  if (propId.includes('windmill')) return 'animate-spin-slow';
  return 'animate-bounce-gentle';
}

/**
 * Renders an individual interactive prop in the Empire scene
 * Props can be furniture, decorations, or interactive elements
 */
export function EmpirePropComponent({ 
  prop, 
  onClick, 
  isHighlighted,
  parallaxOffset = { x: 0, y: 0 },
  enableMicroDepth = false,
  catsNearby = 0,
  isBeingUsed = false,
  isSummoning = false,
}: EmpirePropComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate micro-depth parallax transform based on Y position
  const microDepthTransform = useMemo(() => {
    if (!enableMicroDepth || (parallaxOffset.x === 0 && parallaxOffset.y === 0)) {
      return '';
    }
    
    // Add hover depth boost for interactive feel
    const hoverBoost = isHovered && prop.interactable ? 0.08 : 0;
    const adjustedMicroRange = MICRO_DEPTH_CONFIG.props.microRange + hoverBoost;
    
    return getObjectParallaxTransform(
      parallaxOffset,
      prop.position.y,
      MICRO_DEPTH_CONFIG.props.baseDepth,
      adjustedMicroRange
    );
  }, [parallaxOffset, prop.position.y, enableMicroDepth, isHovered, prop.interactable]);

  const interactionDesc = useMemo(() => getInteractionDescription(prop.onInteract), [prop.onInteract]);
  const animationClass = useMemo(() => getPropAnimation(prop.id, isBeingUsed), [prop.id, isBeingUsed]);

  const propContent = (
    <div
      className={cn(
        'absolute transition-all duration-300 select-none will-change-transform',
        prop.interactable && 'cursor-pointer hover:scale-110 active:scale-95',
        isHighlighted && 'animate-pulse',
        isBeingUsed && 'scale-105',
        isSummoning && 'scale-110 animate-bounce',
        animationClass
      )}
      style={{
        left: `${prop.position.x}%`,
        top: `${prop.position.y}%`,
        transform: `${microDepthTransform} translate(-50%, -50%) scale(${prop.scale})`,
        zIndex: prop.zIndex,
        fontSize: '2rem',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => prop.interactable && onClick?.(prop.id)}
      onKeyDown={(e) => {
        if (prop.interactable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(prop.id);
        }
      }}
      role={prop.interactable ? 'button' : undefined}
      tabIndex={prop.interactable ? 0 : undefined}
      aria-label={prop.interactable ? `Interact with ${prop.name}` : prop.name}
    >
      {/* Glow effect when cats are nearby or summoning */}
      {(catsNearby > 0 || isSummoning) && (prop.attractsCats || isSummoning) && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full blur-lg -z-10",
            isSummoning ? "animate-ping" : "animate-pulse"
          )}
          style={{
            background: isSummoning 
              ? `radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)`
              : `radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)`,
            transform: 'scale(2)',
          }}
        />
      )}
      
      {/* Summoning indicator - paw prints */}
      {isSummoning && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg animate-bounce">
          🐾
        </div>
      )}
      
      {/* Main prop emoji */}
      <span className={cn(
        'drop-shadow-md filter relative',
        isBeingUsed && 'drop-shadow-lg'
      )}>
        {prop.emoji}
      </span>
      
      {/* Cat count indicator when cats are at the prop */}
      {catsNearby > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm animate-bounce-gentle">
          {catsNearby}
        </div>
      )}
      
      {/* Attraction radius indicator (only shown when highlighted) */}
      {isHighlighted && prop.attractsCats && prop.attractionRadius && (
        <div 
          className="absolute rounded-full border-2 border-primary/30 bg-primary/5 pointer-events-none animate-ping"
          style={{
            width: `${prop.attractionRadius * 4}px`,
            height: `${prop.attractionRadius * 4}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      
      {/* Interactable indicator */}
      {prop.interactable && !isBeingUsed && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs">👆</span>
        </div>
      )}
    </div>
  );

  // Wrap with tooltip if prop has description
  if (prop.interactable || prop.attractsCats) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group">{propContent}</div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-center">
            <p className="font-medium">{prop.name}</p>
            {interactionDesc && <p className="text-xs text-muted-foreground">{interactionDesc}</p>}
            {prop.attractsCats && <p className="text-xs text-primary">🐱 Attracts cats</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return propContent;
}

export default EmpirePropComponent;
