import { EmpireProp as EmpirePropType } from '@/types/empire';
import { cn } from '@/lib/utils';

interface EmpirePropComponentProps {
  prop: EmpirePropType;
  onClick?: (propId: string) => void;
  isHighlighted?: boolean;
  parallaxOffset?: { x: number; y: number };
}

/**
 * Renders an individual interactive prop in the Empire scene
 * Props can be furniture, decorations, or interactive elements
 */
export function EmpirePropComponent({ 
  prop, 
  onClick, 
  isHighlighted,
  parallaxOffset = { x: 0, y: 0 }
}: EmpirePropComponentProps) {
  // Calculate parallax based on prop's z-index (higher = more movement)
  const parallaxMultiplier = prop.zIndex > 15 ? 0.8 : prop.zIndex > 10 ? 0.5 : 0.2;
  const offsetX = parallaxOffset.x * parallaxMultiplier;
  const offsetY = parallaxOffset.y * parallaxMultiplier;

  return (
    <div
      className={cn(
        'absolute transition-transform duration-200 select-none',
        prop.interactable && 'cursor-pointer hover:scale-110 active:scale-95',
        isHighlighted && 'animate-pulse'
      )}
      style={{
        left: `calc(${prop.position.x}% + ${offsetX}px)`,
        top: `calc(${prop.position.y}% + ${offsetY}px)`,
        transform: `translate(-50%, -50%) scale(${prop.scale})`,
        zIndex: prop.zIndex,
        fontSize: '2rem',
      }}
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
      <span className="drop-shadow-md filter">{prop.emoji}</span>
      
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
    </div>
  );
}

export default EmpirePropComponent;
