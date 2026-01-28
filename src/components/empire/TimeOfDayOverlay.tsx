import { getTimeOfDay, TIME_OF_DAY_OVERLAYS } from '@/lib/empireTimeOfDay';
import { cn } from '@/lib/utils';

interface TimeOfDayOverlayProps {
  gameDay: number;
  className?: string;
}

/**
 * Renders a gradient overlay based on time of day
 * Cycles through morning (golden), afternoon (neutral), evening (warm), night (cool)
 */
export function TimeOfDayOverlay({ gameDay, className }: TimeOfDayOverlayProps) {
  const timeOfDay = getTimeOfDay(gameDay);
  const overlay = TIME_OF_DAY_OVERLAYS[timeOfDay];

  // Don't render anything for afternoon (no overlay)
  if (overlay.opacity === 0) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none transition-all duration-1000',
        `bg-gradient-to-b ${overlay.gradient}`,
        className
      )}
      style={{ opacity: overlay.opacity }}
      aria-hidden="true"
    >
      {/* Morning sun rays effect */}
      {timeOfDay === 'morning' && <SunRays />}
      
      {/* Night stars effect */}
      {timeOfDay === 'night' && <Stars />}
    </div>
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
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,220,100,0.3) 10deg, transparent 20deg, transparent 45deg, rgba(255,220,100,0.2) 55deg, transparent 65deg, transparent 90deg)',
          animation: 'spin 60s linear infinite',
        }}
      />
    </div>
  );
}

/**
 * Animated stars for night time
 */
function Stars() {
  const stars = [
    { x: 15, y: 10, size: 'text-xs', delay: 0 },
    { x: 30, y: 5, size: 'text-sm', delay: 1 },
    { x: 50, y: 12, size: 'text-xs', delay: 0.5 },
    { x: 70, y: 8, size: 'text-sm', delay: 1.5 },
    { x: 85, y: 15, size: 'text-xs', delay: 0.8 },
    { x: 25, y: 18, size: 'text-xs', delay: 2 },
    { x: 60, y: 20, size: 'text-xs', delay: 1.2 },
    { x: 80, y: 6, size: 'text-xs', delay: 0.3 },
    { x: 40, y: 15, size: 'text-sm', delay: 1.8 },
  ];

  return (
    <>
      {stars.map((star, i) => (
        <span
          key={i}
          className={cn(
            'absolute opacity-70',
            star.size
          )}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animation: `pulse 2s ease-in-out ${star.delay}s infinite`,
          }}
        >
          ✨
        </span>
      ))}
      {/* Moon */}
      <span 
        className="absolute text-2xl opacity-80"
        style={{ left: '85%', top: '8%' }}
      >
        🌙
      </span>
    </>
  );
}

export default TimeOfDayOverlay;
