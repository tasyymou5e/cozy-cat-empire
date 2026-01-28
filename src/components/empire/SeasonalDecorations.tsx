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
 */
export function SeasonalDecorations({ season, houseSize, className }: SeasonalDecorationsProps) {
  const zone = ENHANCED_EMPIRE_ZONES[houseSize];
  const decorations = zone.seasonalDecorations?.[season] || [];

  if (decorations.length === 0) return null;

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none', className)}
      aria-hidden="true"
    >
      {decorations.map((deco, i) => (
        <span
          key={`${season}-${i}`}
          className="absolute animate-float"
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
      
      {/* Extra seasonal ambient decorations */}
      <SeasonalAmbient season={season} />
    </div>
  );
}

/**
 * Additional ambient effects based on season
 */
function SeasonalAmbient({ season }: { season: RealSeason }) {
  switch (season) {
    case 'spring':
      return <SpringPetals />;
    case 'summer':
      return null; // Summer is handled by main particles
    case 'autumn':
      return <FallingLeaves />;
    case 'winter':
      return <Snowflakes />;
    default:
      return null;
  }
}

/**
 * Gentle falling spring petals
 */
function SpringPetals() {
  const petals = Array.from({ length: 5 }, (_, i) => ({
    x: 10 + i * 20,
    delay: i * 0.8,
    duration: 6 + Math.random() * 2,
  }));

  return (
    <>
      {petals.map((petal, i) => (
        <span
          key={i}
          className="absolute text-sm opacity-60"
          style={{
            left: `${petal.x}%`,
            animation: `fall ${petal.duration}s linear ${petal.delay}s infinite`,
          }}
        >
          🌸
        </span>
      ))}
    </>
  );
}

/**
 * Falling autumn leaves
 */
function FallingLeaves() {
  const leaves = ['🍂', '🍁', '🍃'];
  const items = Array.from({ length: 6 }, (_, i) => ({
    emoji: leaves[i % leaves.length],
    x: 5 + i * 15,
    delay: i * 1.2,
    duration: 8 + Math.random() * 3,
  }));

  return (
    <>
      {items.map((leaf, i) => (
        <span
          key={i}
          className="absolute text-sm opacity-50"
          style={{
            left: `${leaf.x}%`,
            animation: `fall ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
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
function Snowflakes() {
  const flakes = Array.from({ length: 8 }, (_, i) => ({
    x: 5 + i * 12,
    delay: i * 0.6,
    duration: 10 + Math.random() * 5,
    size: Math.random() > 0.5 ? 'text-xs' : 'text-sm',
  }));

  return (
    <>
      {flakes.map((flake, i) => (
        <span
          key={i}
          className={cn('absolute opacity-70', flake.size)}
          style={{
            left: `${flake.x}%`,
            animation: `fall ${flake.duration}s linear ${flake.delay}s infinite`,
          }}
        >
          ❄️
        </span>
      ))}
    </>
  );
}

export default SeasonalDecorations;
