import { cn } from '@/lib/utils';
import { TimeOfDay } from '@/types/empire';

interface MansionBackgroundProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Illustrated SVG background for Mansion dwelling
 * Features: Luxury parlor with chandelier, marble floors, ornate details
 */
export function MansionBackground({ timeOfDay, className }: MansionBackgroundProps) {
  const ambientColors = {
    morning: { wall: 'hsl(270, 30%, 92%)', accent: 'hsl(45, 70%, 75%)' },
    afternoon: { wall: 'hsl(270, 25%, 95%)', accent: 'hsl(45, 65%, 80%)' },
    evening: { wall: 'hsl(270, 35%, 85%)', accent: 'hsl(35, 80%, 65%)' },
    night: { wall: 'hsl(270, 40%, 25%)', accent: 'hsl(45, 60%, 50%)' },
  };

  const colors = ambientColors[timeOfDay];

  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn('absolute inset-0 w-full h-full', className)}
    >
      <defs>
        {/* Wall gradient - elegant purple/lavender */}
        <linearGradient id="mansion-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.wall} />
          <stop offset="100%" stopColor="hsl(270, 25%, 80%)" />
        </linearGradient>

        {/* Marble floor pattern */}
        <pattern id="mansion-marble" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="hsl(40, 20%, 92%)" />
          <rect x="0" y="0" width="49" height="49" fill="hsl(40, 15%, 95%)" />
          <rect x="51" y="0" width="49" height="49" fill="hsl(40, 18%, 90%)" />
          <rect x="0" y="51" width="49" height="49" fill="hsl(40, 18%, 90%)" />
          <rect x="51" y="51" width="49" height="49" fill="hsl(40, 15%, 95%)" />
          {/* Marble veins */}
          <path d="M10,20 Q30,25 40,15" stroke="hsl(40, 10%, 85%)" strokeWidth="0.5" fill="none" />
          <path d="M60,70 Q80,65 90,80" stroke="hsl(40, 10%, 85%)" strokeWidth="0.5" fill="none" />
        </pattern>

        {/* Chandelier glow */}
        <radialGradient id="mansion-chandelier-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Gold gradient for accents */}
        <linearGradient id="mansion-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(45, 80%, 55%)" />
          <stop offset="50%" stopColor="hsl(45, 85%, 70%)" />
          <stop offset="100%" stopColor="hsl(45, 80%, 50%)" />
        </linearGradient>

        {/* Wall panel pattern */}
        <pattern id="mansion-panel" patternUnits="userSpaceOnUse" width="200" height="300">
          <rect width="200" height="300" fill="none" />
          <rect x="10" y="10" width="180" height="280" fill="none" stroke="hsl(270, 20%, 75%)" strokeWidth="3" rx="5" />
          <rect x="25" y="25" width="150" height="250" fill="none" stroke="hsl(270, 15%, 80%)" strokeWidth="1" rx="3" />
        </pattern>
      </defs>

      {/* Background wall */}
      <rect x="0" y="0" width="1200" height="350" fill="url(#mansion-wall)" />

      {/* Wall paneling overlay */}
      <rect x="0" y="20" width="1200" height="320" fill="url(#mansion-panel)" opacity="0.4" />

      {/* Ornate crown molding */}
      <rect x="0" y="0" width="1200" height="8" fill="url(#mansion-gold)" />
      <rect x="0" y="8" width="1200" height="12" fill="hsl(0, 0%, 96%)" />
      {/* Decorative trim */}
      {[...Array(24)].map((_, i) => (
        <rect key={i} x={i * 50 + 5} y="10" width="40" height="8" fill="hsl(0, 0%, 92%)" rx="2" />
      ))}

      {/* Columns - Left */}
      <g transform="translate(50, 40)">
        {/* Column base */}
        <rect x="0" y="280" width="80" height="25" fill="hsl(0, 0%, 92%)" />
        <rect x="5" y="275" width="70" height="10" fill="hsl(0, 0%, 88%)" />
        {/* Column shaft */}
        <rect x="10" y="30" width="60" height="245" fill="hsl(0, 0%, 95%)" />
        {/* Fluting */}
        {[...Array(5)].map((_, i) => (
          <rect key={i} x={15 + i * 11} y="30" width="6" height="245" fill="hsl(0, 0%, 90%)" />
        ))}
        {/* Column capital */}
        <rect x="0" y="10" width="80" height="25" fill="hsl(0, 0%, 92%)" />
        <rect x="5" y="5" width="70" height="10" fill="url(#mansion-gold)" opacity="0.6" />
        <rect x="10" y="0" width="60" height="8" fill="hsl(0, 0%, 94%)" />
      </g>

      {/* Columns - Right */}
      <g transform="translate(1070, 40)">
        <rect x="0" y="280" width="80" height="25" fill="hsl(0, 0%, 92%)" />
        <rect x="5" y="275" width="70" height="10" fill="hsl(0, 0%, 88%)" />
        <rect x="10" y="30" width="60" height="245" fill="hsl(0, 0%, 95%)" />
        {[...Array(5)].map((_, i) => (
          <rect key={i} x={15 + i * 11} y="30" width="6" height="245" fill="hsl(0, 0%, 90%)" />
        ))}
        <rect x="0" y="10" width="80" height="25" fill="hsl(0, 0%, 92%)" />
        <rect x="5" y="5" width="70" height="10" fill="url(#mansion-gold)" opacity="0.6" />
        <rect x="10" y="0" width="60" height="8" fill="hsl(0, 0%, 94%)" />
      </g>

      {/* Grand Chandelier */}
      <g transform="translate(600, 20)">
        {/* Glow effect */}
        <ellipse cx="0" cy="60" rx="150" ry="100" fill="url(#mansion-chandelier-glow)" />
        
        {/* Chain */}
        <rect x="-3" y="-20" width="6" height="40" fill="url(#mansion-gold)" />
        
        {/* Main body */}
        <ellipse cx="0" cy="40" rx="60" ry="15" fill="url(#mansion-gold)" />
        <ellipse cx="0" cy="45" rx="50" ry="12" fill="hsl(45, 70%, 60%)" />
        
        {/* Crystal drops */}
        {[-50, -30, -10, 10, 30, 50].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="45" x2={x} y2="70" stroke="hsl(45, 60%, 70%)" strokeWidth="1" />
            <ellipse cx={x} cy="75" rx="4" ry="8" fill="hsl(200, 30%, 95%)" opacity="0.9" />
          </g>
        ))}
        
        {/* Light bulbs */}
        {[-40, 0, 40].map((x, i) => (
          <ellipse key={i} cx={x} cy="35" rx="6" ry="8" fill={colors.accent} opacity="0.8" />
        ))}
      </g>

      {/* Ornate mirror/artwork - Center */}
      <g transform="translate(500, 80)">
        {/* Ornate frame */}
        <ellipse cx="100" cy="80" rx="90" ry="75" fill="url(#mansion-gold)" />
        <ellipse cx="100" cy="80" rx="80" ry="65" fill="hsl(200, 20%, 85%)" />
        {/* Mirror reflection */}
        <ellipse cx="100" cy="80" rx="75" ry="60" fill="hsl(200, 30%, 92%)" />
        <ellipse cx="85" cy="70" rx="20" ry="30" fill="hsl(0, 0%, 98%)" opacity="0.3" />
      </g>

      {/* Fine art - Left */}
      <g transform="translate(180, 100)">
        <rect x="0" y="0" width="120" height="150" fill="url(#mansion-gold)" rx="3" />
        <rect x="8" y="8" width="104" height="134" fill="hsl(30, 40%, 85%)" />
        {/* Classical painting representation */}
        <rect x="12" y="12" width="96" height="126" fill="hsl(35, 30%, 70%)" />
        <ellipse cx="60" cy="70" rx="30" ry="40" fill="hsl(25, 60%, 75%)" opacity="0.7" />
        <rect x="30" y="100" width="60" height="30" fill="hsl(120, 30%, 50%)" opacity="0.5" />
      </g>

      {/* Fine art - Right */}
      <g transform="translate(900, 100)">
        <rect x="0" y="0" width="100" height="130" fill="url(#mansion-gold)" rx="3" />
        <rect x="6" y="6" width="88" height="118" fill="hsl(220, 30%, 60%)" />
        {/* Abstract art */}
        <circle cx="50" cy="50" r="25" fill="hsl(350, 60%, 55%)" />
        <rect x="20" y="70" width="60" height="40" fill="hsl(45, 70%, 65%)" opacity="0.7" />
      </g>

      {/* Baseboard - ornate */}
      <rect x="0" y="335" width="1200" height="18" fill="hsl(0, 0%, 94%)" />
      <rect x="0" y="335" width="1200" height="5" fill="url(#mansion-gold)" opacity="0.5" />

      {/* Marble Floor */}
      <rect x="0" y="350" width="1200" height="250" fill="url(#mansion-marble)" />

      {/* Floor reflection/shine */}
      <rect x="0" y="350" width="1200" height="250" fill="hsl(0, 0%, 100%)" opacity="0.1" />

      {/* Grand rug in center */}
      <ellipse cx="600" cy="480" rx="220" ry="70" fill="hsl(350, 45%, 40%)" opacity="0.9" />
      <ellipse cx="600" cy="480" rx="190" ry="58" fill="hsl(350, 50%, 35%)" />
      <ellipse cx="600" cy="480" rx="160" ry="48" fill="hsl(350, 45%, 40%)" />
      {/* Rug pattern - Persian style */}
      <ellipse cx="600" cy="480" rx="100" ry="30" fill="url(#mansion-gold)" opacity="0.4" />
      <ellipse cx="600" cy="480" rx="50" ry="15" fill="hsl(350, 55%, 45%)" opacity="0.8" />

      {/* Velvet chaise on right */}
      <g transform="translate(850, 400)">
        <path d="M0,80 Q50,60 150,70 L150,100 L0,100 Z" fill="hsl(280, 40%, 35%)" />
        <path d="M0,60 Q50,40 150,50 L150,80 Q50,70 0,80 Z" fill="hsl(280, 45%, 45%)" />
        {/* Tufting */}
        <circle cx="40" cy="65" r="8" fill="hsl(280, 50%, 50%)" opacity="0.5" />
        <circle cx="80" cy="60" r="8" fill="hsl(280, 50%, 50%)" opacity="0.5" />
        <circle cx="120" cy="62" r="8" fill="hsl(280, 50%, 50%)" opacity="0.5" />
        {/* Arm/back */}
        <ellipse cx="0" cy="50" rx="20" ry="40" fill="hsl(280, 40%, 38%)" />
      </g>

      {/* Piano on left */}
      <g transform="translate(150, 380)">
        {/* Piano body */}
        <path d="M0,100 L0,20 Q80,0 160,20 L160,100 Z" fill="hsl(0, 0%, 15%)" />
        {/* Piano top (open) */}
        <path d="M0,20 Q80,-10 160,20 L140,10 Q80,-5 20,10 Z" fill="hsl(0, 0%, 20%)" />
        {/* Keys area */}
        <rect x="10" y="85" width="140" height="12" fill="hsl(0, 0%, 95%)" />
        {/* Black keys */}
        {[20, 35, 55, 70, 85, 105, 120].map((x, i) => (
          <rect key={i} x={x} y="85" width="8" height="7" fill="hsl(0, 0%, 10%)" />
        ))}
        {/* Legs */}
        <rect x="15" y="100" width="10" height="30" fill="hsl(0, 0%, 12%)" />
        <rect x="135" y="100" width="10" height="30" fill="hsl(0, 0%, 12%)" />
      </g>

      {/* Fountain (decorative centerpiece) */}
      <g transform="translate(550, 520)">
        <ellipse cx="50" cy="40" rx="60" ry="20" fill="hsl(0, 0%, 85%)" />
        <ellipse cx="50" cy="35" rx="50" ry="15" fill="hsl(200, 40%, 75%)" />
        <rect x="40" y="0" width="20" height="35" fill="hsl(0, 0%, 90%)" />
        <ellipse cx="50" cy="0" rx="15" ry="8" fill="hsl(0, 0%, 88%)" />
        {/* Water sparkles */}
        <circle cx="35" cy="30" r="2" fill="hsl(200, 60%, 85%)" opacity="0.8" />
        <circle cx="65" cy="32" r="2" fill="hsl(200, 60%, 85%)" opacity="0.8" />
      </g>
    </svg>
  );
}
