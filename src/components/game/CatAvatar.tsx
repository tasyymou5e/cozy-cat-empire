import { Cat } from '@/types/game';
import { CatAppearance, FUR_COLORS, EYE_COLORS, generateDefaultAppearance } from '@/types/catAppearance';
import { Costume, getCostumeById } from '@/types/costumes';
import { getGradeTier } from '@/types/grading';
import { cn } from '@/lib/utils';

/**
 * Props for the CatAvatar component
 */
interface CatAvatarProps {
  /** The cat data for generating the avatar */
  cat: Cat;
  /** Optional costume ID to display on the cat */
  equippedCostumeId?: string;
  /** Size variant for the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show equipped costume */
  showCostume?: boolean;
  /** Enable micro-animations (breathing, blinking, ear twitches) */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CatAvatar - Renders a customizable cat face avatar
 * 
 * Generates a unique cat avatar based on breed appearance including fur color,
 * pattern, eye color, and facial features. Supports costumes, animations,
 * and tier-specific effects for rare cats.
 * 
 * @example
 * ```tsx
 * <CatAvatar 
 *   cat={myCat} 
 *   size="md" 
 *   animated 
 *   equippedCostumeId="crown"
 * />
 * ```
 */

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const earSizes = {
  xs: { width: 6, height: 8 },
  sm: { width: 10, height: 14 },
  md: { width: 14, height: 18 },
  lg: { width: 20, height: 26 },
  xl: { width: 26, height: 34 },
};

const eyeSizes = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
};

// SVG Fur Texture Filter Component
function FurTextureFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="furTexture" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" seed="5" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export function CatAvatar({ 
  cat, 
  equippedCostumeId, 
  size = 'md', 
  showCostume = true,
  animated = false,
  className,
}: CatAvatarProps) {
  const appearance: CatAppearance = cat.appearance || generateDefaultAppearance(cat.breed);
  const costume = showCostume && equippedCostumeId ? getCostumeById(equippedCostumeId) : null;
  const tier = getGradeTier(cat.grade);
  
  const furColor = FUR_COLORS[appearance.furColor]?.hex || '#F97316';
  const eyeColorPrimary = EYE_COLORS[appearance.eyeColor]?.hex || '#22C55E';
  const eyeColorSecondary = EYE_COLORS[appearance.eyeColor]?.secondary || eyeColorPrimary;
  const patternColor = appearance.patternColor || '#1C1917';
  
  const ear = earSizes[size];
  const eyeSize = eyeSizes[size];

  // Hair style affects the silhouette
  const hairStyle = {
    short: 'rounded-full',
    medium: 'rounded-[45%]',
    fluffy: 'rounded-[40%]',
  }[appearance.hairLength];

  const fluffyScale = appearance.hairLength === 'fluffy' ? 'scale-110' : '';

  // Animation classes based on tier
  const tierAnimation = animated ? {
    ultraRare: 'animate-bounce',
    veryRare: 'animate-pulse',
    rare: '',
    uncommon: '',
    common: '',
  }[tier] : '';

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* SVG Filters */}
      <FurTextureFilter />
      
      {/* Main cat head with breathing animation when animated */}
      <div 
        className={cn(
          'relative w-full h-full transition-transform duration-300',
          hairStyle,
          fluffyScale,
          tierAnimation,
          animated && 'animate-cat-breathe'
        )}
        style={{ 
          backgroundColor: furColor,
          filter: 'url(#furTexture)',
          boxShadow: `
            0 4px 6px -1px rgba(0,0,0,0.1),
            inset 0 -6px 12px -6px rgba(0,0,0,0.15)
          `,
        }}
      >
        {/* Pattern overlay */}
        {appearance.pattern !== 'solid' && (
          <PatternOverlay 
            pattern={appearance.pattern} 
            color={patternColor} 
            size={size}
          />
        )}

        {/* Left Ear with twitch animation */}
        <div 
          className={cn(
            "absolute -top-[20%] left-[10%]",
            animated && "animate-ear-twitch-left"
          )}
          style={{ 
            width: ear.width, 
            height: ear.height,
            backgroundColor: furColor,
            borderRadius: '50% 50% 0 0',
            transform: 'rotate(-20deg)',
            transformOrigin: 'bottom center',
            boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div 
            className="absolute top-[20%] left-[20%] w-[60%] h-[60%]"
            style={{ 
              backgroundColor: '#FECACA',
              borderRadius: '50% 50% 0 0',
            }}
          />
        </div>
        
        {/* Right Ear with twitch animation (different timing) */}
        <div 
          className={cn(
            "absolute -top-[20%] right-[10%]",
            animated && "animate-ear-twitch-right"
          )}
          style={{ 
            width: ear.width, 
            height: ear.height,
            backgroundColor: furColor,
            borderRadius: '50% 50% 0 0',
            transform: 'rotate(20deg)',
            transformOrigin: 'bottom center',
            boxShadow: 'inset 2px -2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div 
            className="absolute top-[20%] left-[20%] w-[60%] h-[60%]"
            style={{ 
              backgroundColor: '#FECACA',
              borderRadius: '50% 50% 0 0',
            }}
          />
        </div>

        {/* Left Eye with reflections and blink */}
        <div className="absolute top-[35%] left-[20%] flex items-center justify-center">
          <div 
            className="rounded-full relative overflow-hidden"
            style={{ 
              width: eyeSize * 1.5, 
              height: eyeSize,
              backgroundColor: eyeColorPrimary,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {/* Pupil */}
            <div 
              className="absolute rounded-full bg-black"
              style={{ 
                width: eyeSize * 0.5,
                height: eyeSize * 0.7,
                top: '15%',
                left: '35%',
              }}
            />
            {/* Primary reflection with shimmer */}
            <div 
              className={cn(
                "absolute bg-white/90 rounded-full",
                animated && "animate-eye-shimmer"
              )}
              style={{ 
                width: eyeSize * 0.3,
                height: eyeSize * 0.3,
                top: '15%',
                left: '55%',
              }}
            />
            {/* Secondary reflection */}
            <div 
              className="absolute bg-white/40 rounded-full"
              style={{ 
                width: eyeSize * 0.15,
                height: eyeSize * 0.15,
                top: '50%',
                left: '65%',
              }}
            />
            {/* Blink overlay */}
            {animated && (
              <div 
                className="absolute inset-0 rounded-full animate-cat-blink origin-top"
                style={{ backgroundColor: furColor }}
              />
            )}
          </div>
        </div>
        
        {/* Right Eye with reflections and blink */}
        <div className="absolute top-[35%] right-[20%] flex items-center justify-center">
          <div 
            className="rounded-full relative overflow-hidden"
            style={{ 
              width: eyeSize * 1.5, 
              height: eyeSize,
              backgroundColor: appearance.eyeColor === 'heterochromia' ? eyeColorSecondary : eyeColorPrimary,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {/* Pupil */}
            <div 
              className="absolute rounded-full bg-black"
              style={{ 
                width: eyeSize * 0.5,
                height: eyeSize * 0.7,
                top: '15%',
                left: '35%',
              }}
            />
            {/* Primary reflection with shimmer */}
            <div 
              className={cn(
                "absolute bg-white/90 rounded-full",
                animated && "animate-eye-shimmer"
              )}
              style={{ 
                width: eyeSize * 0.3,
                height: eyeSize * 0.3,
                top: '15%',
                left: '55%',
              }}
            />
            {/* Secondary reflection */}
            <div 
              className="absolute bg-white/40 rounded-full"
              style={{ 
                width: eyeSize * 0.15,
                height: eyeSize * 0.15,
                top: '50%',
                left: '65%',
              }}
            />
            {/* Blink overlay */}
            {animated && (
              <div 
                className="absolute inset-0 rounded-full animate-cat-blink origin-top"
                style={{ backgroundColor: furColor }}
              />
            )}
          </div>
        </div>

        {/* Nose with subtle shadow */}
        <div 
          className="absolute top-[55%] left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${eyeSize * 0.4}px solid transparent`,
            borderRight: `${eyeSize * 0.4}px solid transparent`,
            borderTop: `${eyeSize * 0.5}px solid #FCA5A5`,
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
          }}
        />

        {/* Mouth */}
        <div className="absolute top-[62%] left-1/2 -translate-x-1/2 flex gap-[1px]">
          <div 
            className="rounded-b-full border-b border-muted-foreground/50"
            style={{ width: eyeSize * 0.4, height: eyeSize * 0.3 }}
          />
          <div 
            className="rounded-b-full border-b border-muted-foreground/50"
            style={{ width: eyeSize * 0.4, height: eyeSize * 0.3 }}
          />
        </div>

        {/* SVG Whiskers with wiggle animation */}
        {(appearance.facialFeature === 'whiskers_long' || appearance.facialFeature === 'normal') && (
          <svg 
            className="absolute inset-0 pointer-events-none overflow-visible" 
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Left whiskers */}
            <path 
              d="M 25 58 Q 10 55, -5 52" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '25% 58%' }}
            />
            <path 
              d="M 25 55 Q 12 50, 0 48" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '25% 55%', animationDelay: '0.1s' }}
            />
            <path 
              d="M 25 61 Q 10 62, -5 60" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '25% 61%', animationDelay: '0.2s' }}
            />
            {/* Right whiskers */}
            <path 
              d="M 75 58 Q 90 55, 105 52" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '75% 58%', animationDelay: '0.15s' }}
            />
            <path 
              d="M 75 55 Q 88 50, 100 48" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '75% 55%', animationDelay: '0.25s' }}
            />
            <path 
              d="M 75 61 Q 90 62, 105 60" 
              stroke="rgba(0,0,0,0.3)" 
              strokeWidth="0.8" 
              fill="none"
              className={cn(animated && "animate-whisker-wiggle")}
              style={{ transformOrigin: '75% 61%', animationDelay: '0.05s' }}
            />
          </svg>
        )}

        {/* Facial features */}
        <FacialFeatureOverlay feature={appearance.facialFeature} size={size} eyeSize={eyeSize} />
      </div>

      {/* Costume overlays */}
      {costume && (
        <CostumeOverlay costume={costume} size={size} />
      )}

      {/* Ultra rare shimmer effect */}
      {tier === 'ultraRare' && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 animate-shimmer rounded-full pointer-events-none" />
      )}
    </div>
  );
}

function PatternOverlay({ pattern, color, size }: { pattern: string; color: string; size: string }) {
  const patternStyles: Record<string, React.CSSProperties> = {
    tabby: {
      background: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 4px,
        ${color}33 4px,
        ${color}33 6px
      )`,
    },
    spotted: {
      background: `radial-gradient(circle at 25% 25%, ${color}66 2px, transparent 2px),
                   radial-gradient(circle at 75% 35%, ${color}66 2px, transparent 2px),
                   radial-gradient(circle at 50% 75%, ${color}66 2px, transparent 2px)`,
    },
    tuxedo: {
      background: `linear-gradient(to bottom, transparent 50%, ${color}88 50%)`,
    },
    bicolor: {
      background: `linear-gradient(135deg, transparent 50%, ${color}66 50%)`,
    },
    calico: {
      background: `radial-gradient(ellipse at 20% 30%, #F9731666 0%, transparent 30%),
                   radial-gradient(ellipse at 70% 60%, #1C191766 0%, transparent 25%),
                   radial-gradient(ellipse at 40% 80%, ${color}66 0%, transparent 20%)`,
    },
  };

  return (
    <div 
      className="absolute inset-0 rounded-[inherit]"
      style={patternStyles[pattern] || {}}
    />
  );
}

function FacialFeatureOverlay({ feature, size, eyeSize }: { feature: string; size: string; eyeSize: number }) {
  if (feature === 'normal' || feature === 'whiskers_long') return null;

  const features: Record<string, React.ReactNode> = {
    scar: (
      <div 
        className="absolute top-[30%] right-[25%] w-[2px] h-[25%] bg-red-400/60 rotate-45"
      />
    ),
    eyepatch: (
      <div 
        className="absolute top-[32%] right-[18%] bg-black rounded-full"
        style={{ width: eyeSize * 2, height: eyeSize * 1.3 }}
      />
    ),
    grumpy: (
      <>
        <div className="absolute top-[30%] left-[18%] w-[20%] h-[2px] bg-muted-foreground/60 -rotate-12" />
        <div className="absolute top-[30%] right-[18%] w-[20%] h-[2px] bg-muted-foreground/60 rotate-12" />
      </>
    ),
    cute_blush: (
      <>
        <div 
          className="absolute top-[48%] left-[8%] rounded-full bg-pink-300/50"
          style={{ width: eyeSize, height: eyeSize * 0.6 }}
        />
        <div 
          className="absolute top-[48%] right-[8%] rounded-full bg-pink-300/50"
          style={{ width: eyeSize, height: eyeSize * 0.6 }}
        />
      </>
    ),
  };

  return <>{features[feature]}</>;
}

function CostumeOverlay({ costume, size }: { costume: Costume; size: string }) {
  const positionByCategory = {
    hat: 'absolute -top-[30%] left-1/2 -translate-x-1/2 text-lg z-10',
    outfit: 'absolute -bottom-[20%] left-1/2 -translate-x-1/2 text-sm z-10',
    accessory: 'absolute top-[45%] -right-[15%] text-sm z-10',
    special: 'absolute -top-[25%] left-1/2 -translate-x-1/2 text-lg z-10',
  };

  const sizeMultipliers = {
    xs: 0.5,
    sm: 0.7,
    md: 1,
    lg: 1.3,
    xl: 1.6,
  };

  const multiplier = sizeMultipliers[size as keyof typeof sizeMultipliers] || 1;

  return (
    <div 
      className={positionByCategory[costume.category]}
      style={{ 
        fontSize: `${1 * multiplier}rem`,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
      }}
    >
      {costume.emoji}
    </div>
  );
}