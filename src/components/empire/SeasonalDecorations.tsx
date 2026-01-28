import { useMemo } from 'react';
import { RealSeason } from '@/lib/seasonUtils';
import { HouseSize } from '@/types/game';
import { ENHANCED_EMPIRE_ZONES } from '@/config/empire';
import { cn } from '@/lib/utils';

interface SeasonalDecorationsProps {
  season: RealSeason;
  houseSize: HouseSize;
  className?: string;
}

/**
 * Renders seasonal decorations based on real-world season
 * Each house type has unique seasonal decorations defined in ENHANCED_EMPIRE_ZONES
 * Includes static decorations and animated ambient effects
 */
export function SeasonalDecorations({ season, houseSize, className }: SeasonalDecorationsProps) {
  const zone = ENHANCED_EMPIRE_ZONES[houseSize];
  const decorations = zone.seasonalDecorations?.[season] || [];

  // Memoize ambient particle positions
  const ambientParticles = useMemo(() => generateAmbientParticles(season), [season]);

  if (decorations.length === 0 && ambientParticles.length === 0) return null;

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none z-35', className)}
      aria-hidden="true"
    >
      {/* Static seasonal decorations from zone config */}
      {decorations.map((deco, i) => (
        <span
          key={`${season}-deco-${i}`}
          className="absolute animate-float drop-shadow-sm"
          style={{
            left: `${deco.position.x}%`,
            top: `${deco.position.y}%`,
            fontSize: '1.5rem',
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${3 + (i % 2)}s`,
          }}
        >
          {deco.emoji}
        </span>
      ))}
      
      {/* Animated ambient particles based on season */}
      <SeasonalAmbient season={season} particles={ambientParticles} />

      {/* Season-specific overlay effects */}
      <SeasonOverlayEffect season={season} />
    </div>
  );
}

/**
 * Generate random positions for ambient particles
 */
function generateAmbientParticles(season: RealSeason): Array<{
  x: number;
  delay: number;
  duration: number;
  size: 'text-xs' | 'text-sm';
  emoji: string;
}> {
  const config = SEASON_PARTICLE_CONFIG[season];
  
  return Array.from({ length: config.count }, (_, i) => ({
    x: 5 + (i * (90 / config.count)) + (Math.random() * 10 - 5),
    delay: i * config.delayMultiplier + Math.random(),
    duration: config.baseDuration + Math.random() * config.durationVariance,
    size: Math.random() > 0.5 ? 'text-xs' : 'text-sm' as const,
    emoji: config.emojis[i % config.emojis.length],
  }));
}

const SEASON_PARTICLE_CONFIG: Record<RealSeason, {
  emojis: string[];
  count: number;
  baseDuration: number;
  durationVariance: number;
  delayMultiplier: number;
}> = {
  spring: {
    emojis: ['🌸', '🌺', '💮'],
    count: 8,
    baseDuration: 6,
    durationVariance: 3,
    delayMultiplier: 0.8,
  },
  summer: {
    emojis: ['☀️', '🦋', '✨'],
    count: 6,
    baseDuration: 8,
    durationVariance: 4,
    delayMultiplier: 1.2,
  },
  autumn: {
    emojis: ['🍂', '🍁', '🍃'],
    count: 10,
    baseDuration: 7,
    durationVariance: 4,
    delayMultiplier: 1.0,
  },
  winter: {
    emojis: ['❄️', '❅', '❆'],
    count: 12,
    baseDuration: 9,
    durationVariance: 5,
    delayMultiplier: 0.6,
  },
};

/**
 * Animated ambient effects based on season
 */
function SeasonalAmbient({ 
  season, 
  particles 
}: { 
  season: RealSeason; 
  particles: ReturnType<typeof generateAmbientParticles>;
}) {
  switch (season) {
    case 'spring':
      return <FallingPetals particles={particles} />;
    case 'summer':
      return <FloatingButterflies particles={particles} />;
    case 'autumn':
      return <FallingLeaves particles={particles} />;
    case 'winter':
      return <FallingSnow particles={particles} />;
    default:
      return null;
  }
}

/**
 * Season-specific overlay color wash
 */
function SeasonOverlayEffect({ season }: { season: RealSeason }) {
  const overlays: Record<RealSeason, string> = {
    spring: 'rgba(255, 200, 220, 0.05)', // Soft pink
    summer: 'rgba(255, 240, 200, 0.05)', // Warm yellow
    autumn: 'rgba(255, 180, 120, 0.08)', // Orange tint
    winter: 'rgba(200, 220, 255, 0.08)', // Cool blue
  };

  return (
    <div 
      className="absolute inset-0 transition-colors duration-1000"
      style={{ backgroundColor: overlays[season] }}
    />
  );
}

/**
 * Gentle falling spring petals
 */
function FallingPetals({ particles }: { particles: ReturnType<typeof generateAmbientParticles> }) {
  return (
    <>
      {particles.map((petal, i) => (
        <span
          key={i}
          className={cn('absolute opacity-70', petal.size)}
          style={{
            left: `${petal.x}%`,
            animation: `fall ${petal.duration}s ease-in-out ${petal.delay}s infinite, sway 3s ease-in-out ${petal.delay}s infinite`,
          }}
        >
          {petal.emoji}
        </span>
      ))}
    </>
  );
}

/**
 * Floating summer butterflies
 */
function FloatingButterflies({ particles }: { particles: ReturnType<typeof generateAmbientParticles> }) {
  return (
    <>
      {particles.map((butterfly, i) => (
        <span
          key={i}
          className={cn('absolute opacity-80', butterfly.size)}
          style={{
            left: `${butterfly.x}%`,
            top: `${20 + (i * 10) % 40}%`,
            animation: `float ${butterfly.duration}s ease-in-out ${butterfly.delay}s infinite`,
          }}
        >
          {butterfly.emoji}
        </span>
      ))}
    </>
  );
}

/**
 * Falling autumn leaves
 */
function FallingLeaves({ particles }: { particles: ReturnType<typeof generateAmbientParticles> }) {
  return (
    <>
      {particles.map((leaf, i) => (
        <span
          key={i}
          className={cn('absolute opacity-60', leaf.size)}
          style={{
            left: `${leaf.x}%`,
            animation: `fall ${leaf.duration}s ease-in-out ${leaf.delay}s infinite, spin ${leaf.duration * 0.8}s linear ${leaf.delay}s infinite`,
          }}
        >
          {leaf.emoji}
        </span>
      ))}
    </>
  );
}

/**
 * Gentle falling snowflakes
 */
function FallingSnow({ particles }: { particles: ReturnType<typeof generateAmbientParticles> }) {
  return (
    <>
      {particles.map((flake, i) => (
        <span
          key={i}
          className={cn('absolute opacity-80', flake.size)}
          style={{
            left: `${flake.x}%`,
            animation: `fall ${flake.duration}s linear ${flake.delay}s infinite, sway 4s ease-in-out ${flake.delay}s infinite`,
          }}
        >
          {flake.emoji}
        </span>
      ))}
    </>
  );
}

export default SeasonalDecorations;
