import { cn } from '@/lib/utils';
import { TimeOfDay } from '@/types/empire';

interface FarmBackgroundProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Illustrated SVG background for Farm dwelling
 * Features: Outdoor pastoral scene with barn, rolling hills, fence, sky
 */
export function FarmBackground({ timeOfDay, className }: FarmBackgroundProps) {
  const skyColors = {
    morning: { top: '#FFE4B5', mid: '#FFA07A', bottom: '#87CEEB' },
    afternoon: { top: '#87CEEB', mid: '#B0E0E6', bottom: '#98FB98' },
    evening: { top: '#FF6347', mid: '#FF8C00', bottom: '#4B0082' },
    night: { top: '#0d1b2a', mid: '#1b263b', bottom: '#415a77' },
  };

  const groundColors = {
    morning: { grass: 'hsl(95, 50%, 45%)', hills: 'hsl(100, 45%, 40%)' },
    afternoon: { grass: 'hsl(100, 55%, 50%)', hills: 'hsl(105, 50%, 45%)' },
    evening: { grass: 'hsl(95, 40%, 35%)', hills: 'hsl(100, 35%, 30%)' },
    night: { grass: 'hsl(100, 25%, 20%)', hills: 'hsl(105, 20%, 15%)' },
  };

  const sky = skyColors[timeOfDay];
  const ground = groundColors[timeOfDay];
  const isNight = timeOfDay === 'night';

  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn('absolute inset-0 w-full h-full', className)}
    >
      <defs>
        {/* Sky gradient */}
        <linearGradient id="farm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="50%" stopColor={sky.mid} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>

        {/* Grass texture */}
        <pattern id="farm-grass" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill={ground.grass} />
          <line x1="5" y1="20" x2="5" y2="15" stroke="hsl(100, 60%, 55%)" strokeWidth="1" />
          <line x1="10" y1="20" x2="10" y2="14" stroke="hsl(100, 55%, 52%)" strokeWidth="1" />
          <line x1="15" y1="20" x2="15" y2="16" stroke="hsl(100, 58%, 54%)" strokeWidth="1" />
        </pattern>

        {/* Wood grain for barn */}
        <pattern id="farm-wood" patternUnits="userSpaceOnUse" width="30" height="100">
          <rect width="30" height="100" fill="hsl(15, 60%, 35%)" />
          <rect x="0" y="0" width="14" height="100" fill="hsl(15, 55%, 38%)" />
          <line x1="7" y1="0" x2="7" y2="100" stroke="hsl(15, 50%, 30%)" strokeWidth="0.5" />
          <line x1="22" y1="0" x2="22" y2="100" stroke="hsl(15, 50%, 30%)" strokeWidth="0.5" />
        </pattern>

        {/* Sun/moon glow */}
        <radialGradient id="farm-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isNight ? 'hsl(45, 50%, 90%)' : 'hsl(45, 100%, 70%)'} stopOpacity="1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="1200" height="350" fill="url(#farm-sky)" />

      {/* Sun or Moon */}
      <g transform={`translate(${isNight ? 900 : 150}, 80)`}>
        {/* Glow */}
        <ellipse cx="0" cy="0" rx="80" ry="80" fill="url(#farm-sun-glow)" opacity="0.5" />
        {/* Sun/Moon body */}
        <circle cx="0" cy="0" r={isNight ? 30 : 40} fill={isNight ? 'hsl(45, 40%, 90%)' : 'hsl(45, 100%, 65%)'} />
        {isNight && (
          <>
            {/* Moon craters */}
            <circle cx="-10" cy="-5" r="5" fill="hsl(45, 20%, 80%)" opacity="0.5" />
            <circle cx="8" cy="10" r="4" fill="hsl(45, 20%, 80%)" opacity="0.4" />
          </>
        )}
      </g>

      {/* Stars (night only) */}
      {isNight && (
        <g fill="hsl(0, 0%, 100%)" opacity="0.8">
          {[
            { x: 100, y: 50 }, { x: 250, y: 80 }, { x: 400, y: 30 },
            { x: 550, y: 90 }, { x: 700, y: 45 }, { x: 850, y: 70 },
            { x: 1000, y: 40 }, { x: 180, y: 120 }, { x: 620, y: 110 },
            { x: 950, y: 130 }, { x: 350, y: 100 }, { x: 780, y: 60 },
          ].map((star, i) => (
            <circle key={i} cx={star.x} cy={star.y} r={Math.random() * 1.5 + 0.5} />
          ))}
        </g>
      )}

      {/* Clouds */}
      {!isNight && (
        <g fill="hsl(0, 0%, 98%)" opacity="0.9">
          <ellipse cx="300" cy="100" rx="60" ry="25" />
          <ellipse cx="340" cy="95" rx="45" ry="22" />
          <ellipse cx="270" cy="105" rx="40" ry="18" />
          
          <ellipse cx="800" cy="70" rx="50" ry="20" />
          <ellipse cx="835" cy="65" rx="40" ry="18" />
          <ellipse cx="770" cy="75" rx="35" ry="15" />
          
          <ellipse cx="1050" cy="120" rx="45" ry="18" />
          <ellipse cx="1080" cy="115" rx="35" ry="15" />
        </g>
      )}

      {/* Distant hills */}
      <path d="M0,280 Q150,220 350,260 Q550,200 750,250 Q950,190 1200,260 L1200,350 L0,350 Z" fill={ground.hills} opacity="0.7" />
      <path d="M0,300 Q200,250 400,290 Q600,230 850,280 Q1050,220 1200,280 L1200,350 L0,350 Z" fill={ground.hills} opacity="0.85" />

      {/* Windmill in distance */}
      <g transform="translate(200, 200)">
        <rect x="-8" y="0" width="16" height="100" fill="hsl(0, 0%, 85%)" />
        {/* Blades */}
        <g transform="rotate(15)">
          <rect x="-3" y="-50" width="6" height="50" fill="hsl(0, 0%, 80%)" rx="2" />
          <rect x="-3" y="0" width="6" height="50" fill="hsl(0, 0%, 80%)" rx="2" />
          <rect x="-50" y="-3" width="50" height="6" fill="hsl(0, 0%, 80%)" rx="2" />
          <rect x="0" y="-3" width="50" height="6" fill="hsl(0, 0%, 80%)" rx="2" />
        </g>
        <circle cx="0" cy="0" r="8" fill="hsl(0, 0%, 70%)" />
      </g>

      {/* Main ground/grass area */}
      <rect x="0" y="320" width="1200" height="280" fill="url(#farm-grass)" />

      {/* Rolling hills in foreground */}
      <path d="M0,380 Q200,350 400,380 Q600,340 800,370 Q1000,350 1200,380 L1200,400 L0,400 Z" fill={ground.grass} />

      {/* Red Barn */}
      <g transform="translate(900, 180)">
        {/* Barn body */}
        <rect x="0" y="80" width="200" height="140" fill="url(#farm-wood)" />
        <rect x="0" y="80" width="200" height="140" fill="hsl(0, 70%, 40%)" opacity="0.7" />
        
        {/* Barn roof */}
        <path d="M-10,80 L100,10 L210,80 Z" fill="hsl(0, 60%, 30%)" />
        <path d="M0,80 L100,20 L200,80 Z" fill="hsl(0, 65%, 35%)" />
        
        {/* Barn doors */}
        <rect x="60" y="130" width="80" height="90" fill="hsl(0, 60%, 25%)" />
        <line x1="100" y1="130" x2="100" y2="220" stroke="hsl(0, 50%, 20%)" strokeWidth="3" />
        {/* Door handles */}
        <circle cx="90" cy="175" r="4" fill="hsl(45, 50%, 60%)" />
        <circle cx="110" cy="175" r="4" fill="hsl(45, 50%, 60%)" />
        
        {/* Hay loft window */}
        <rect x="75" y="50" width="50" height="40" fill="hsl(0, 50%, 20%)" />
        <rect x="80" y="55" width="40" height="30" fill="hsl(45, 70%, 65%)" opacity="0.3" />
        
        {/* X decoration on barn */}
        <line x1="20" y1="90" x2="50" y2="125" stroke="hsl(0, 0%, 95%)" strokeWidth="4" />
        <line x1="50" y1="90" x2="20" y2="125" stroke="hsl(0, 0%, 95%)" strokeWidth="4" />
        <line x1="150" y1="90" x2="180" y2="125" stroke="hsl(0, 0%, 95%)" strokeWidth="4" />
        <line x1="180" y1="90" x2="150" y2="125" stroke="hsl(0, 0%, 95%)" strokeWidth="4" />
      </g>

      {/* Silo next to barn */}
      <g transform="translate(850, 200)">
        <rect x="0" y="40" width="40" height="120" fill="hsl(0, 0%, 75%)" />
        <ellipse cx="20" cy="40" rx="20" ry="8" fill="hsl(0, 0%, 80%)" />
        <path d="M0,40 Q20,20 40,40" fill="hsl(0, 0%, 70%)" />
        {/* Silo bands */}
        <rect x="0" y="70" width="40" height="4" fill="hsl(0, 0%, 65%)" />
        <rect x="0" y="110" width="40" height="4" fill="hsl(0, 0%, 65%)" />
      </g>

      {/* Wooden Fence - across the scene */}
      <g>
        {/* Fence posts */}
        {[100, 200, 300, 400, 500, 600, 700].map((x, i) => (
          <g key={i} transform={`translate(${x}, 380)`}>
            <rect x="-6" y="0" width="12" height="60" fill="hsl(30, 40%, 40%)" />
            <path d="M-6,0 L0,-10 L6,0 Z" fill="hsl(30, 35%, 45%)" />
          </g>
        ))}
        {/* Fence rails */}
        <rect x="94" y="395" width="620" height="8" fill="hsl(30, 40%, 45%)" rx="2" />
        <rect x="94" y="420" width="620" height="8" fill="hsl(30, 40%, 45%)" rx="2" />
      </g>

      {/* Hay bales */}
      <g transform="translate(300, 430)">
        <ellipse cx="30" cy="25" rx="35" ry="25" fill="hsl(45, 70%, 55%)" />
        <ellipse cx="30" cy="25" rx="30" ry="20" fill="hsl(45, 65%, 60%)" />
        {/* Hay texture */}
        <line x1="10" y1="20" x2="10" y2="30" stroke="hsl(45, 60%, 50%)" strokeWidth="1" />
        <line x1="25" y1="15" x2="25" y2="35" stroke="hsl(45, 60%, 50%)" strokeWidth="1" />
        <line x1="40" y1="18" x2="40" y2="32" stroke="hsl(45, 60%, 50%)" strokeWidth="1" />
      </g>

      <g transform="translate(360, 440)">
        <ellipse cx="25" cy="20" rx="28" ry="20" fill="hsl(45, 68%, 52%)" />
        <ellipse cx="25" cy="20" rx="24" ry="16" fill="hsl(45, 63%, 58%)" />
      </g>

      {/* Tractor */}
      <g transform="translate(550, 450)">
        {/* Body */}
        <rect x="20" y="10" width="70" height="40" fill="hsl(120, 60%, 35%)" rx="5" />
        <rect x="10" y="30" width="30" height="25" fill="hsl(120, 55%, 30%)" rx="3" />
        {/* Cabin */}
        <rect x="25" y="-20" width="40" height="35" fill="hsl(200, 50%, 70%)" opacity="0.6" />
        <rect x="30" y="-15" width="30" height="25" fill="hsl(200, 60%, 80%)" opacity="0.4" />
        {/* Wheels */}
        <circle cx="25" cy="55" r="20" fill="hsl(0, 0%, 25%)" />
        <circle cx="25" cy="55" r="15" fill="hsl(0, 0%, 35%)" />
        <circle cx="25" cy="55" r="5" fill="hsl(45, 50%, 60%)" />
        <circle cx="80" cy="50" r="15" fill="hsl(0, 0%, 25%)" />
        <circle cx="80" cy="50" r="11" fill="hsl(0, 0%, 35%)" />
        <circle cx="80" cy="50" r="4" fill="hsl(45, 50%, 60%)" />
        {/* Exhaust pipe */}
        <rect x="85" y="0" width="6" height="20" fill="hsl(0, 0%, 40%)" />
      </g>

      {/* Sunflowers */}
      {!isNight && (
        <g>
          {[150, 180, 750, 780].map((x, i) => (
            <g key={i} transform={`translate(${x}, 470)`}>
              <rect x="-2" y="0" width="4" height="40" fill="hsl(100, 50%, 35%)" />
              <circle cx="0" cy="-5" r="12" fill="hsl(45, 90%, 55%)" />
              <circle cx="0" cy="-5" r="6" fill="hsl(30, 60%, 35%)" />
            </g>
          ))}
        </g>
      )}

      {/* Water trough */}
      <g transform="translate(80, 480)">
        <rect x="0" y="10" width="60" height="25" fill="hsl(200, 15%, 50%)" rx="3" />
        <rect x="5" y="5" width="50" height="15" fill="hsl(200, 40%, 70%)" rx="2" />
        {/* Water */}
        <rect x="8" y="8" width="44" height="10" fill="hsl(200, 50%, 60%)" opacity="0.7" />
        {/* Legs */}
        <rect x="5" y="35" width="8" height="20" fill="hsl(200, 15%, 45%)" />
        <rect x="47" y="35" width="8" height="20" fill="hsl(200, 15%, 45%)" />
      </g>

      {/* Wildflowers scattered in grass */}
      <g>
        {[
          { x: 450, y: 520, color: 'hsl(350, 70%, 60%)' },
          { x: 480, y: 530, color: 'hsl(50, 80%, 60%)' },
          { x: 510, y: 515, color: 'hsl(280, 60%, 65%)' },
          { x: 650, y: 540, color: 'hsl(350, 70%, 60%)' },
          { x: 680, y: 525, color: 'hsl(50, 80%, 60%)' },
          { x: 120, y: 550, color: 'hsl(280, 60%, 65%)' },
          { x: 820, y: 535, color: 'hsl(350, 70%, 60%)' },
        ].map((flower, i) => (
          <g key={i}>
            <line x1={flower.x} y1={flower.y} x2={flower.x} y2={flower.y + 15} stroke="hsl(100, 50%, 40%)" strokeWidth="2" />
            <circle cx={flower.x} cy={flower.y} r="5" fill={flower.color} />
          </g>
        ))}
      </g>
    </svg>
  );
}
