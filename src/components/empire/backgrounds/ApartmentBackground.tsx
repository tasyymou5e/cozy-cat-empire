import { cn } from '@/lib/utils';
import { TimeOfDay } from '@/types/empire';

interface ApartmentBackgroundProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Illustrated SVG background for Apartment dwelling
 * Features: Cozy urban interior with window view, wooden floors, warm walls
 */
export function ApartmentBackground({ timeOfDay, className }: ApartmentBackgroundProps) {
  const skyColors = {
    morning: { top: '#FFE4C4', bottom: '#87CEEB' },
    afternoon: { top: '#87CEEB', bottom: '#E0F4FF' },
    evening: { top: '#FF7F50', bottom: '#4B0082' },
    night: { top: '#1a1a2e', bottom: '#16213e' },
  };

  const windowGlow = {
    morning: 'rgba(255, 200, 100, 0.3)',
    afternoon: 'rgba(255, 255, 200, 0.2)',
    evening: 'rgba(255, 150, 100, 0.4)',
    night: 'rgba(100, 150, 255, 0.1)',
  };

  const sky = skyColors[timeOfDay];
  const glow = windowGlow[timeOfDay];

  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn('absolute inset-0 w-full h-full', className)}
    >
      <defs>
        {/* Wall texture gradient */}
        <linearGradient id="apt-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(35, 45%, 85%)" />
          <stop offset="100%" stopColor="hsl(35, 40%, 75%)" />
        </linearGradient>

        {/* Floor wood pattern */}
        <pattern id="apt-floor-pattern" patternUnits="userSpaceOnUse" width="60" height="20">
          <rect width="60" height="20" fill="hsl(25, 40%, 45%)" />
          <rect x="0" y="0" width="29" height="9" fill="hsl(25, 35%, 50%)" rx="1" />
          <rect x="31" y="0" width="29" height="9" fill="hsl(25, 38%, 48%)" rx="1" />
          <rect x="15" y="11" width="29" height="9" fill="hsl(25, 36%, 52%)" rx="1" />
          <rect x="46" y="11" width="14" height="9" fill="hsl(25, 34%, 47%)" rx="1" />
          <rect x="0" y="11" width="13" height="9" fill="hsl(25, 37%, 49%)" rx="1" />
        </pattern>

        {/* Sky gradient for window */}
        <linearGradient id="apt-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>

        {/* Window light glow */}
        <radialGradient id="apt-window-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Baseboard shadow */}
        <linearGradient id="apt-baseboard-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Background wall */}
      <rect x="0" y="0" width="1200" height="350" fill="url(#apt-wall)" />

      {/* Wall texture lines */}
      <g opacity="0.05">
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={i * 30}
            x2="1200"
            y2={i * 30}
            stroke="hsl(25, 30%, 30%)"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* Window - Large center window */}
      <g transform="translate(450, 50)">
        {/* Window glow effect */}
        <ellipse cx="150" cy="120" rx="180" ry="150" fill="url(#apt-window-glow)" />
        
        {/* Window frame outer */}
        <rect x="0" y="0" width="300" height="220" fill="hsl(35, 20%, 95%)" rx="4" />
        
        {/* Sky view through window */}
        <rect x="10" y="10" width="280" height="200" fill="url(#apt-sky)" rx="2" />
        
        {/* City buildings silhouette */}
        <g fill="hsl(220, 20%, 35%)" opacity="0.8">
          <rect x="20" y="120" width="40" height="90" />
          <rect x="25" y="105" width="30" height="15" />
          <rect x="70" y="100" width="50" height="110" />
          <rect x="130" y="130" width="35" height="80" />
          <rect x="175" y="110" width="45" height="100" />
          <rect x="230" y="140" width="40" height="70" />
          {/* Building windows */}
          {timeOfDay === 'night' && (
            <g fill="hsl(45, 80%, 70%)" opacity="0.7">
              <rect x="30" y="130" width="6" height="8" />
              <rect x="42" y="145" width="6" height="8" />
              <rect x="80" y="115" width="8" height="10" />
              <rect x="95" y="130" width="8" height="10" />
              <rect x="185" y="125" width="8" height="10" />
              <rect x="200" y="145" width="8" height="10" />
            </g>
          )}
        </g>

        {/* Window cross frames */}
        <rect x="145" y="10" width="10" height="200" fill="hsl(35, 20%, 90%)" />
        <rect x="10" y="105" width="280" height="8" fill="hsl(35, 20%, 90%)" />
        
        {/* Window frame shadow */}
        <rect x="10" y="10" width="280" height="4" fill="rgba(0,0,0,0.1)" />
      </g>

      {/* Wall decorations - Picture frame left */}
      <g transform="translate(100, 100)">
        <rect x="0" y="0" width="100" height="80" fill="hsl(35, 25%, 50%)" rx="3" />
        <rect x="6" y="6" width="88" height="68" fill="hsl(200, 30%, 70%)" />
        <rect x="10" y="10" width="80" height="60" fill="hsl(180, 25%, 65%)" />
        {/* Abstract art */}
        <circle cx="35" cy="45" r="15" fill="hsl(350, 60%, 65%)" />
        <circle cx="60" cy="35" r="12" fill="hsl(45, 70%, 70%)" />
      </g>

      {/* Wall decorations - Clock right */}
      <g transform="translate(950, 80)">
        <circle cx="50" cy="50" r="45" fill="hsl(35, 20%, 95%)" />
        <circle cx="50" cy="50" r="40" fill="hsl(0, 0%, 98%)" />
        <circle cx="50" cy="50" r="3" fill="hsl(0, 0%, 30%)" />
        {/* Clock hands */}
        <line x1="50" y1="50" x2="50" y2="20" stroke="hsl(0, 0%, 20%)" strokeWidth="2" />
        <line x1="50" y1="50" x2="70" y2="50" stroke="hsl(0, 0%, 20%)" strokeWidth="1.5" />
        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <line
            key={i}
            x1={50 + 35 * Math.cos((angle - 90) * Math.PI / 180)}
            y1={50 + 35 * Math.sin((angle - 90) * Math.PI / 180)}
            x2={50 + 38 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={50 + 38 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="hsl(0, 0%, 30%)"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* Baseboard */}
      <rect x="0" y="340" width="1200" height="15" fill="hsl(35, 20%, 88%)" />
      <rect x="0" y="340" width="1200" height="3" fill="url(#apt-baseboard-shadow)" />

      {/* Floor */}
      <rect x="0" y="350" width="1200" height="250" fill="url(#apt-floor-pattern)" />

      {/* Floor perspective shadow */}
      <rect x="0" y="350" width="1200" height="20" fill="url(#apt-baseboard-shadow)" opacity="0.5" />

      {/* Radiator on left wall */}
      <g transform="translate(50, 260)">
        <rect x="0" y="0" width="120" height="70" fill="hsl(0, 0%, 92%)" rx="3" />
        {[...Array(8)].map((_, i) => (
          <rect key={i} x={5 + i * 14} y="5" width="10" height="60" fill="hsl(0, 0%, 85%)" rx="2" />
        ))}
      </g>

      {/* Potted plant on right */}
      <g transform="translate(1050, 280)">
        {/* Pot */}
        <path d="M10,50 L20,20 L80,20 L90,50 Z" fill="hsl(15, 60%, 45%)" />
        <ellipse cx="50" cy="20" rx="30" ry="8" fill="hsl(15, 60%, 40%)" />
        {/* Plant */}
        <ellipse cx="50" cy="10" rx="35" ry="25" fill="hsl(120, 40%, 40%)" />
        <ellipse cx="40" cy="0" rx="20" ry="15" fill="hsl(120, 45%, 45%)" />
        <ellipse cx="65" cy="5" rx="18" ry="12" fill="hsl(120, 42%, 42%)" />
      </g>

      {/* Rug in center of floor */}
      <ellipse cx="600" cy="480" rx="200" ry="60" fill="hsl(350, 50%, 55%)" opacity="0.8" />
      <ellipse cx="600" cy="480" rx="170" ry="50" fill="hsl(350, 45%, 50%)" opacity="0.9" />
      <ellipse cx="600" cy="480" rx="140" ry="40" fill="hsl(350, 55%, 60%)" opacity="0.7" />
    </svg>
  );
}
