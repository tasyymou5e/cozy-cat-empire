import { useMemo } from 'react';
import { getTimeOfDay, TIME_OF_DAY_OVERLAYS, getLightBeamConfig } from '@/lib/empireTimeOfDay';
import { cn } from '@/lib/utils';

interface TimeOfDayOverlayProps {
  gameDay: number;
  className?: string;
}

/**
 * Renders a gradient overlay based on time of day
 * Cycles through morning (golden), afternoon (neutral), evening (warm), night (cool)
 * Includes ambient lighting effects like sun rays and stars
 */
export function TimeOfDayOverlay({ gameDay, className }: TimeOfDayOverlayProps) {
  const timeOfDay = getTimeOfDay(gameDay);
  const overlay = TIME_OF_DAY_OVERLAYS[timeOfDay];
  const lightBeam = getLightBeamConfig(timeOfDay);

  // Memoize star positions for consistent rendering
  const starPositions = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      x: 5 + (i * 7) % 90,
      y: 5 + ((i * 13) % 25),
      size: i % 3 === 0 ? 'text-sm' : 'text-xs',
      delay: (i * 0.2) % 3,
      twinkle: i % 4 === 0,
    })), []
  );

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none transition-all duration-1000 z-30',
        className
      )}
      aria-hidden="true"
    >
      {/* Main gradient overlay */}
      {overlay.opacity > 0 && (
        <div
          className={cn('absolute inset-0', `bg-gradient-to-b ${overlay.gradient}`)}
          style={{ opacity: overlay.opacity }}
        />
      )}

      {/* Ambient color wash */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: overlay.ambientColor }}
      />

      {/* Light beam effect (morning/afternoon/evening) */}
      {lightBeam?.show && <LightBeam config={lightBeam} />}

      {/* Morning sun rays effect */}
      {timeOfDay === 'morning' && <SunRays />}
      
      {/* Night stars and moon */}
      {timeOfDay === 'night' && <Stars positions={starPositions} />}

      {/* Evening glow on horizon */}
      {timeOfDay === 'evening' && <SunsetGlow />}

      {/* Vignette effect for atmosphere */}
      <div 
        className="absolute inset-0"
        style={{
          background: timeOfDay === 'night' 
            ? 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.1) 100%)',
        }}
      />
    </div>
  );
}

/**
 * Light beam streaming through window
 */
function LightBeam({ config }: { config: { angle: number; intensity: number; color: string } }) {
  return (
    <div 
      className="absolute top-0 left-1/4 w-1/3 h-full overflow-hidden opacity-60"
      style={{
        transform: `skewX(-${config.angle}deg)`,
        background: `linear-gradient(180deg, ${config.color} 0%, transparent 70%)`,
        opacity: config.intensity,
      }}
    />
  );
}

/**
 * Animated sun rays for morning time
 */
function SunRays() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-1/2 overflow-hidden opacity-30">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full aspect-square"
        style={{
          background: `conic-gradient(from 0deg, 
            transparent 0deg, 
            rgba(255,220,100,0.3) 10deg, 
            transparent 20deg, 
            transparent 45deg, 
            rgba(255,220,100,0.2) 55deg, 
            transparent 65deg, 
            transparent 90deg,
            rgba(255,220,100,0.25) 100deg,
            transparent 110deg
          )`,
          animation: 'spin 60s linear infinite',
        }}
      />
      {/* Sun glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,220,100,0.5) 0%, transparent 70%)',
          transform: 'translateY(-30%)',
        }}
      />
    </div>
  );
}

/**
 * Sunset glow effect for evening
 */
function SunsetGlow() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(255, 100, 50, 0.2) 0%, rgba(255, 150, 100, 0.1) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

/**
 * Animated stars for night time
 */
function Stars({ positions }: { positions: Array<{ x: number; y: number; size: string; delay: number; twinkle: boolean }> }) {
  return (
    <>
      {positions.map((star, i) => (
        <span
          key={i}
          className={cn(
            'absolute opacity-70',
            star.size,
            star.twinkle && 'animate-pulse'
          )}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animation: star.twinkle 
              ? `pulse 2s ease-in-out ${star.delay}s infinite`
              : undefined,
          }}
        >
          {i % 5 === 0 ? '⭐' : '✨'}
        </span>
      ))}
      {/* Moon */}
      <div 
        className="absolute text-4xl"
        style={{ 
          left: '80%', 
          top: '8%',
          filter: 'drop-shadow(0 0 10px rgba(255,255,200,0.5))',
        }}
      >
        🌙
      </div>
      {/* Moon glow */}
      <div 
        className="absolute w-24 h-24 rounded-full"
        style={{ 
          left: '78%', 
          top: '4%',
          background: 'radial-gradient(circle, rgba(200,200,255,0.3) 0%, transparent 70%)',
        }}
      />
    </>
  );
}

export default TimeOfDayOverlay;
