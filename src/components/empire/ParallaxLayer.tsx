import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Depth multipliers for parallax layers
 * Higher values = more movement (closer to viewer)
 * Lower values = less movement (further away)
 */
export const PARALLAX_DEPTHS = {
  background: 0.1,    // Furthest - minimal movement
  midBackground: 0.25,
  midground: 0.5,     // Medium movement
  midForeground: 0.75,
  foreground: 1.0,    // Closest - maximum movement
} as const;

export type ParallaxDepth = keyof typeof PARALLAX_DEPTHS;

interface ParallaxLayerProps {
  children: ReactNode;
  depth: ParallaxDepth | number;
  offset: { x: number; y: number };
  className?: string;
  style?: CSSProperties;
  /** Whether to apply the parallax transform */
  enabled?: boolean;
  /** Z-index for layer stacking */
  zIndex?: number;
}

/**
 * A layer component that applies parallax transformation based on depth
 * Use with useParallax hook for mouse-responsive depth effects
 */
export function ParallaxLayer({
  children,
  depth,
  offset,
  className,
  style,
  enabled = true,
  zIndex,
}: ParallaxLayerProps) {
  const depthMultiplier = typeof depth === 'number' ? depth : PARALLAX_DEPTHS[depth];
  
  const transform = enabled
    ? `translate3d(${offset.x * depthMultiplier}px, ${offset.y * depthMultiplier}px, 0)`
    : undefined;

  return (
    <div
      className={cn('absolute inset-0 will-change-transform', className)}
      style={{
        transform,
        transition: 'transform 0.1s ease-out',
        zIndex,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Container for parallax layers with proper overflow handling
 */
interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxContainer({ children, className }: ParallaxContainerProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
    </div>
  );
}
