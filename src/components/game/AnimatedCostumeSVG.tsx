/**
 * AnimatedCostumeSVG - Renders costume overlays with animated effects
 * 
 * Supports various animation types: glow, sparkle, flow, rainbow, shimmer
 * Includes particle effects for legendary items
 */

import React, { useMemo } from 'react';
import { VectorCostume } from '@/lib/costumeVectors';
import { GRAPHICS_CONFIG } from '@/config/graphics';
import { cn } from '@/lib/utils';

interface AnimatedCostumeSVGProps {
  costume: VectorCostume;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isAnimated?: boolean;
  className?: string;
}

// Map animation types to CSS classes
const animationClassMap: Record<string, string> = {
  'glow-gold': 'animate-costume-glow-gold',
  'glow-vip': 'animate-costume-glow-vip',
  'glow-fire': 'animate-costume-glow-fire',
  'flow': 'animate-costume-flow',
  'rainbow': 'animate-costume-rainbow',
  'flutter': 'animate-costume-flutter',
  'sparkle': 'animate-costume-sparkle',
  'shimmer-bronze': 'animate-costume-shimmer-bronze',
  'shimmer-silver': 'animate-costume-shimmer-silver',
};

// Particle positions (pre-calculated for performance)
const particlePositions = [
  { x: -15, y: -20, delay: 0 },
  { x: 12, y: -25, delay: 0.3 },
  { x: -8, y: -30, delay: 0.6 },
  { x: 18, y: -15, delay: 0.9 },
  { x: -20, y: -10, delay: 1.2 },
];

export function AnimatedCostumeSVG({
  costume,
  size,
  isAnimated = true,
  className,
}: AnimatedCostumeSVGProps) {
  const scale = costume.scales[size] || costume.scales.md || 1;
  const shouldAnimate = isAnimated && GRAPHICS_CONFIG.enableCostumeAnimations;
  
  // Get animation class
  const animationClass = useMemo(() => {
    if (!shouldAnimate || !costume.animation?.className) return '';
    return animationClassMap[costume.animation.className] || '';
  }, [shouldAnimate, costume.animation?.className]);

  // Render particles if costume has them
  const renderParticles = () => {
    if (!shouldAnimate || !costume.particles) return null;
    
    const { type, count, color } = costume.particles;
    const particleColor = color || '#FFD700';
    const particlesToRender = particlePositions.slice(0, count);
    
    return (
      <>
        {particlesToRender.map((pos, i) => (
          <g 
            key={i} 
            className="animate-particle-sparkle"
            style={{ animationDelay: `${pos.delay}s` }}
          >
            {type === 'sparkles' && (
              <path
                d={`M${pos.x},${pos.y} l2,-2 l2,2 l-2,2 z`}
                fill={particleColor}
              />
            )}
            {type === 'stars' && (
              <path
                d={`M${pos.x},${pos.y - 3} l1,2 l2,0 l-1.5,1.5 l0.5,2 l-2,-1 l-2,1 l0.5,-2 l-1.5,-1.5 l2,0 z`}
                fill={particleColor}
              />
            )}
            {type === 'hearts' && (
              <path
                d={`M${pos.x},${pos.y} c-1,-2 -3,-2 -3,0 c0,2 3,4 3,4 c0,0 3,-2 3,-4 c0,-2 -2,-2 -3,0 z`}
                fill="#FF69B4"
                transform="scale(0.5)"
              />
            )}
            {type === 'magic' && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={1.5}
                fill={particleColor}
              />
            )}
          </g>
        ))}
      </>
    );
  };

  return (
    <svg
      viewBox="-40 -55 80 70"
      className={cn(
        'absolute w-full h-full pointer-events-none',
        animationClass,
        className
      )}
      style={{
        transform: `scale(${scale})`,
      }}
    >
      {/* Gradient definitions for special costumes */}
      <defs>
        <linearGradient id="unicornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB6C1" />
          <stop offset="50%" stopColor="#DDA0DD" />
          <stop offset="100%" stopColor="#87CEEB" />
        </linearGradient>
      </defs>

      {/* Main costume group */}
      <g transform={`translate(${costume.anchor.x}, ${costume.anchor.y})`}>
        {/* Main path */}
        <path
          d={costume.path}
          fill={costume.fill}
          stroke={costume.stroke}
          strokeWidth={costume.strokeWidth}
        />
        
        {/* Decorations */}
        {costume.decorations?.map((dec, i) => (
          <path
            key={i}
            d={dec.path}
            fill={dec.fill}
            stroke={dec.stroke}
          />
        ))}
      </g>

      {/* Particle effects */}
      {renderParticles()}
    </svg>
  );
}

export default AnimatedCostumeSVG;
