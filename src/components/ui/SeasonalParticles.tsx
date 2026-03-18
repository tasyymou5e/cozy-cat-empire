import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { RealSeason } from '@/lib/seasonUtils';

interface SeasonalParticlesProps {
  season: RealSeason;
  density?: 'light' | 'medium' | 'heavy';
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

// SVG Snowflake
const Snowflake = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ opacity }}
    className="text-primary-foreground dark:text-foreground drop-shadow-sm"
  >
    <path
      d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

// SVG Cherry Blossom Petal
const CherryBlossom = ({ size, opacity }: { size: number; opacity: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ opacity }}
  >
    <ellipse cx="12" cy="10" rx="6" ry="8" fill="#FFB7C5" />
    <ellipse cx="12" cy="10" rx="4" ry="6" fill="#FFC0CB" />
    <circle cx="12" cy="18" r="2" fill="#FFD1DC" />
  </svg>
);

// Firefly (glowing dot)
const Firefly = ({ size, opacity }: { size: number; opacity: number }) => (
  <div
    className="rounded-full bg-yellow-300 animate-pulse"
    style={{
      width: size,
      height: size,
      opacity,
      boxShadow: `0 0 ${size * 2}px ${size}px rgba(255, 220, 100, 0.6)`,
    }}
  />
);

// SVG Autumn Leaf
const AutumnLeaf = ({ size, opacity, variant }: { size: number; opacity: number; variant: number }) => {
  const colors = ['#D2691E', '#FF6347', '#FF8C00', '#8B4513', '#CD853F'];
  const color = colors[variant % colors.length];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity }}
    >
      <path
        d="M12 2C8 6 4 10 4 14c0 4 3.5 8 8 8s8-4 8-8c0-4-4-8-8-12z"
        fill={color}
      />
      <path
        d="M12 6v14M8 10l4 4M16 10l-4 4"
        stroke={color === '#D2691E' ? '#8B4513' : '#A0522D'}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 10 + Math.random() * 14,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 12,
    opacity: 0.5 + Math.random() * 0.5,
  }));
}

export function SeasonalParticles({ 
  season, 
  density = 'medium', 
  className 
}: SeasonalParticlesProps) {
  const particleCount = density === 'light' ? 15 : density === 'medium' ? 30 : 50;
  
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  const getAnimationClass = () => {
    switch (season) {
      case 'winter': return 'animate-snowfall';
      case 'spring': return 'animate-blossom-float';
      case 'summer': return 'animate-firefly-glow';
      case 'autumn': return 'animate-leaf-fall';
      default: return 'animate-snowfall';
    }
  };

  const renderParticle = (particle: Particle) => {
    switch (season) {
      case 'winter':
        return <Snowflake size={particle.size} opacity={particle.opacity} />;
      case 'spring':
        return <CherryBlossom size={particle.size * 1.2} opacity={particle.opacity} />;
      case 'summer':
        return <Firefly size={particle.size * 0.4} opacity={particle.opacity} />;
      case 'autumn':
        return <AutumnLeaf size={particle.size * 1.3} opacity={particle.opacity} variant={particle.id} />;
      default:
        return <Snowflake size={particle.size} opacity={particle.opacity} />;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none overflow-hidden z-[4]",
        className
      )}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn("absolute", getAnimationClass())}
          style={{
            left: `${particle.left}%`,
            top: '-5%',
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            animationIterationCount: 'infinite',
          }}
        >
          {renderParticle(particle)}
        </div>
      ))}
    </div>
  );
}
