import { ParticleType } from '@/types/empire';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface EmpireParticlesProps {
  type: ParticleType;
  density?: 'light' | 'medium' | 'heavy';
  enableReducedMotion?: boolean;
  className?: string;
}

/**
 * Particle configuration by type
 */
const PARTICLE_CONFIG: Record<ParticleType, {
  emoji: string;
  baseCount: number;
  sizeClass: string;
  opacity: number;
  animationDuration: { min: number; max: number };
}> = {
  'dust-motes': {
    emoji: '·',
    baseCount: 15,
    sizeClass: 'text-xs',
    opacity: 0.4,
    animationDuration: { min: 8, max: 15 },
  },
  'fireflies': {
    emoji: '✨',
    baseCount: 8,
    sizeClass: 'text-xs',
    opacity: 0.7,
    animationDuration: { min: 4, max: 8 },
  },
  'sparkles': {
    emoji: '✦',
    baseCount: 10,
    sizeClass: 'text-xs',
    opacity: 0.6,
    animationDuration: { min: 3, max: 6 },
  },
  'leaves': {
    emoji: '🍃',
    baseCount: 6,
    sizeClass: 'text-sm',
    opacity: 0.5,
    animationDuration: { min: 10, max: 18 },
  },
  'snow': {
    emoji: '❄️',
    baseCount: 12,
    sizeClass: 'text-xs',
    opacity: 0.6,
    animationDuration: { min: 12, max: 20 },
  },
  'petals': {
    emoji: '🌸',
    baseCount: 8,
    sizeClass: 'text-sm',
    opacity: 0.5,
    animationDuration: { min: 8, max: 14 },
  },
};

/**
 * Density multipliers
 */
const DENSITY_MULTIPLIER = {
  light: 0.6,
  medium: 1,
  heavy: 1.5,
};

/**
 * Lightweight particle system for atmospheric effects
 * Renders particles that float, drift, or fall based on type
 */
export function EmpireParticles({ 
  type, 
  density = 'light', 
  enableReducedMotion,
  className 
}: EmpireParticlesProps) {
  const config = PARTICLE_CONFIG[type];
  const count = Math.floor(config.baseCount * DENSITY_MULTIPLIER[density]);

  // Generate particle positions deterministically - hooks must be before conditionals
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = i * 7919; // Prime number for pseudo-randomness
      return {
        id: i,
        x: (seed % 90) + 5, // 5-95%
        startY: ((seed * 13) % 60) + 20, // 20-80%
        delay: ((seed * 17) % 100) / 10, // 0-10s delay
        duration: config.animationDuration.min + 
          ((seed * 23) % (config.animationDuration.max - config.animationDuration.min)),
        drift: ((seed * 29) % 20) - 10, // -10 to 10px horizontal drift
      };
    });
  }, [count, config.animationDuration.min, config.animationDuration.max]);

  const animationType = getAnimationType(type);

  // Respect reduced motion preference - after all hooks
  if (enableReducedMotion) return null;

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={cn(
            'absolute',
            config.sizeClass
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.startY}%`,
            opacity: config.opacity,
            animation: `${animationType} ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            '--drift': `${particle.drift}px`,
          } as React.CSSProperties}
        >
          {config.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Get appropriate animation type based on particle type
 */
function getAnimationType(type: ParticleType): string {
  switch (type) {
    case 'dust-motes':
    case 'fireflies':
      return 'float';
    case 'sparkles':
      return 'sparkle';
    case 'leaves':
    case 'snow':
    case 'petals':
      return 'fall';
    default:
      return 'float';
  }
}

export default EmpireParticles;
