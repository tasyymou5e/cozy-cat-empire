import { cn } from '@/lib/utils';
import { TimeOfDay } from '@/types/empire';

interface HouseBackgroundProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Illustrated SVG background for House dwelling
 * Features: Suburban living room with bay window showing garden view
 */
export function HouseBackground({ timeOfDay, className }: HouseBackgroundProps) {
  const skyColors = {
    morning: { top: '#FFF8DC', bottom: '#87CEEB' },
    afternoon: { top: '#87CEEB', bottom: '#E8F8E8' },
    evening: { top: '#FF8C69', bottom: '#9370DB' },
    night: { top: '#1a1a2e', bottom: '#2d3a4f' },
  };

  const gardenTones = {
    morning: { grass: 'hsl(100, 45%, 45%)', trees: 'hsl(110, 40%, 35%)' },
    afternoon: { grass: 'hsl(100, 50%, 50%)', trees: 'hsl(110, 45%, 40%)' },
    evening: { grass: 'hsl(100, 35%, 40%)', trees: 'hsl(110, 35%, 30%)' },
    night: { grass: 'hsl(100, 20%, 25%)', trees: 'hsl(110, 20%, 20%)' },
  };

  const sky = skyColors[timeOfDay];
  const garden = gardenTones[timeOfDay];

  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn('absolute inset-0 w-full h-full', className)}
    >
      <defs>
        {/* Wall gradient */}
        <linearGradient id="house-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(45, 40%, 92%)" />
          <stop offset="100%" stopColor="hsl(45, 35%, 85%)" />
        </linearGradient>

        {/* Floor carpet pattern */}
        <pattern id="house-carpet" patternUnits="userSpaceOnUse" width="40" height="40">
          <rect width="40" height="40" fill="hsl(45, 30%, 75%)" />
          <circle cx="20" cy="20" r="15" fill="hsl(45, 25%, 70%)" opacity="0.5" />
          <circle cx="0" cy="0" r="8" fill="hsl(45, 28%, 72%)" opacity="0.3" />
          <circle cx="40" cy="0" r="8" fill="hsl(45, 28%, 72%)" opacity="0.3" />
          <circle cx="0" cy="40" r="8" fill="hsl(45, 28%, 72%)" opacity="0.3" />
          <circle cx="40" cy="40" r="8" fill="hsl(45, 28%, 72%)" opacity="0.3" />
        </pattern>

        {/* Sky gradient */}
        <linearGradient id="house-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>

        {/* Fireplace glow */}
        <radialGradient id="house-fire-glow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="hsl(25, 100%, 50%)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="hsl(35, 90%, 60%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Background wall */}
      <rect x="0" y="0" width="1200" height="350" fill="url(#house-wall)" />

      {/* Crown molding at top */}
      <rect x="0" y="0" width="1200" height="15" fill="hsl(0, 0%, 96%)" />
      <rect x="0" y="15" width="1200" height="5" fill="hsl(0, 0%, 90%)" />

      {/* Bay Window - Large center */}
      <g transform="translate(350, 30)">
        {/* Window frame outer */}
        <path d="M0,280 L0,0 L500,0 L500,280" fill="hsl(0, 0%, 95%)" />
        
        {/* Sky and garden view */}
        <rect x="15" y="15" width="470" height="250" fill="url(#house-sky)" />
        
        {/* Garden - grass */}
        <rect x="15" y="180" width="470" height="85" fill={garden.grass} />
        
        {/* Garden - trees/bushes */}
        <ellipse cx="80" cy="170" rx="40" ry="50" fill={garden.trees} />
        <ellipse cx="150" cy="180" rx="35" ry="40" fill={garden.trees} opacity="0.9" />
        <ellipse cx="400" cy="165" rx="45" ry="55" fill={garden.trees} />
        <ellipse cx="460" cy="175" rx="30" ry="35" fill={garden.trees} opacity="0.85" />
        
        {/* Garden - flowers */}
        <g fill="hsl(340, 70%, 60%)">
          <circle cx="200" cy="220" r="5" />
          <circle cx="220" cy="230" r="4" />
          <circle cx="280" cy="225" r="5" />
          <circle cx="320" cy="235" r="4" />
          <circle cx="350" cy="220" r="5" />
        </g>
        <g fill="hsl(50, 80%, 60%)">
          <circle cx="240" cy="240" r="4" />
          <circle cx="300" cy="230" r="4" />
        </g>

        {/* Window dividers */}
        <rect x="170" y="15" width="8" height="250" fill="hsl(0, 0%, 92%)" />
        <rect x="325" y="15" width="8" height="250" fill="hsl(0, 0%, 92%)" />
        <rect x="15" y="130" width="470" height="6" fill="hsl(0, 0%, 92%)" />

        {/* Window sill */}
        <rect x="-10" y="265" width="520" height="20" fill="hsl(0, 0%, 95%)" />
        <rect x="-10" y="265" width="520" height="4" fill="hsl(0, 0%, 85%)" />
      </g>

      {/* Fireplace on right */}
      <g transform="translate(950, 100)">
        {/* Mantle */}
        <rect x="-20" y="0" width="240" height="20" fill="hsl(0, 0%, 92%)" rx="3" />
        {/* Fireplace surround */}
        <rect x="0" y="20" width="200" height="180" fill="hsl(0, 5%, 25%)" rx="2" />
        {/* Fireplace opening */}
        <path d="M20,60 L20,200 L180,200 L180,60 Q100,30 20,60" fill="hsl(0, 0%, 10%)" />
        {/* Fire glow */}
        <ellipse cx="100" cy="170" rx="60" ry="40" fill="url(#house-fire-glow)" />
        {/* Logs */}
        <ellipse cx="80" cy="185" rx="25" ry="8" fill="hsl(25, 50%, 25%)" />
        <ellipse cx="120" cy="188" rx="25" ry="7" fill="hsl(25, 45%, 22%)" />
        {/* Flames */}
        <path d="M70,170 Q80,140 90,165 Q100,120 110,160 Q120,135 130,170 Z" fill="hsl(35, 100%, 55%)" opacity="0.9" />
        <path d="M85,175 Q95,150 105,170 Q115,145 125,175 Z" fill="hsl(45, 100%, 60%)" opacity="0.8" />
      </g>

      {/* Family photos on left wall */}
      <g transform="translate(50, 80)">
        <rect x="0" y="0" width="80" height="100" fill="hsl(25, 40%, 45%)" rx="2" />
        <rect x="5" y="5" width="70" height="90" fill="hsl(45, 30%, 90%)" />
        {/* Abstract family representation */}
        <circle cx="30" cy="45" r="12" fill="hsl(25, 60%, 70%)" />
        <circle cx="55" cy="45" r="12" fill="hsl(25, 55%, 65%)" />
        <circle cx="42" cy="70" r="8" fill="hsl(25, 65%, 75%)" />
      </g>

      <g transform="translate(150, 100)">
        <rect x="0" y="0" width="60" height="75" fill="hsl(25, 40%, 45%)" rx="2" />
        <rect x="4" y="4" width="52" height="67" fill="hsl(180, 40%, 80%)" />
        {/* Landscape painting */}
        <rect x="4" y="45" width="52" height="26" fill="hsl(100, 40%, 45%)" />
        <circle cx="45" cy="25" r="8" fill="hsl(45, 80%, 70%)" />
      </g>

      {/* Baseboard */}
      <rect x="0" y="340" width="1200" height="12" fill="hsl(0, 0%, 94%)" />

      {/* Floor with carpet */}
      <rect x="0" y="350" width="1200" height="250" fill="url(#house-carpet)" />

      {/* Cozy rug in center */}
      <ellipse cx="500" cy="480" rx="180" ry="55" fill="hsl(25, 50%, 50%)" opacity="0.85" />
      <ellipse cx="500" cy="480" rx="150" ry="45" fill="hsl(25, 45%, 45%)" opacity="0.9" />
      {/* Rug pattern */}
      <ellipse cx="500" cy="480" rx="100" ry="30" fill="hsl(35, 55%, 55%)" opacity="0.6" />

      {/* Couch outline - left side */}
      <g transform="translate(100, 380)">
        <rect x="0" y="30" width="180" height="80" fill="hsl(200, 30%, 50%)" rx="10" />
        <rect x="0" y="10" width="180" height="50" fill="hsl(200, 35%, 55%)" rx="8" />
        {/* Cushions */}
        <ellipse cx="45" cy="35" rx="35" ry="20" fill="hsl(200, 40%, 60%)" />
        <ellipse cx="135" cy="35" rx="35" ry="20" fill="hsl(200, 40%, 60%)" />
        {/* Arm rests */}
        <rect x="-15" y="20" width="25" height="60" fill="hsl(200, 30%, 48%)" rx="6" />
        <rect x="170" y="20" width="25" height="60" fill="hsl(200, 30%, 48%)" rx="6" />
      </g>

      {/* Side table with lamp */}
      <g transform="translate(320, 420)">
        <rect x="0" y="30" width="40" height="60" fill="hsl(25, 50%, 35%)" />
        <rect x="-5" y="25" width="50" height="8" fill="hsl(25, 45%, 40%)" rx="2" />
        {/* Lamp */}
        <rect x="15" y="-20" width="10" height="45" fill="hsl(45, 30%, 60%)" />
        <path d="M0,-35 L40,-35 L30,-20 L10,-20 Z" fill="hsl(45, 60%, 85%)" />
        {timeOfDay === 'evening' || timeOfDay === 'night' ? (
          <ellipse cx="20" cy="-27" rx="25" ry="15" fill="hsl(45, 80%, 70%)" opacity="0.4" />
        ) : null}
      </g>
    </svg>
  );
}
