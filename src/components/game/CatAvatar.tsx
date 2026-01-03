import { Cat } from '@/types/game';
import { CatAppearance, FUR_COLORS, EYE_COLORS, generateDefaultAppearance } from '@/types/catAppearance';
import { Costume, getCostumeById } from '@/types/costumes';
import { getGradeTier } from '@/types/grading';
import { cn } from '@/lib/utils';

interface CatAvatarProps {
  cat: Cat;
  equippedCostumeId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCostume?: boolean;
  animated?: boolean;
  className?: string;
}

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
      {/* Main cat head */}
      <div 
        className={cn(
          'relative w-full h-full transition-transform duration-300',
          hairStyle,
          fluffyScale,
          tierAnimation
        )}
        style={{ backgroundColor: furColor }}
      >
        {/* Pattern overlay */}
        {appearance.pattern !== 'solid' && (
          <PatternOverlay 
            pattern={appearance.pattern} 
            color={patternColor} 
            size={size}
          />
        )}

        {/* Ears */}
        <div 
          className="absolute -top-[20%] left-[10%] rotate-[-20deg]"
          style={{ 
            width: ear.width, 
            height: ear.height,
            backgroundColor: furColor,
            borderRadius: '50% 50% 0 0',
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
        <div 
          className="absolute -top-[20%] right-[10%] rotate-[20deg]"
          style={{ 
            width: ear.width, 
            height: ear.height,
            backgroundColor: furColor,
            borderRadius: '50% 50% 0 0',
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

        {/* Eyes */}
        <div className="absolute top-[35%] left-[20%] flex items-center justify-center">
          <div 
            className="rounded-full relative"
            style={{ 
              width: eyeSize * 1.5, 
              height: eyeSize,
              backgroundColor: eyeColorPrimary,
            }}
          >
            <div 
              className="absolute rounded-full bg-black"
              style={{ 
                width: eyeSize * 0.5,
                height: eyeSize * 0.7,
                top: '15%',
                left: '35%',
              }}
            />
          </div>
        </div>
        <div className="absolute top-[35%] right-[20%] flex items-center justify-center">
          <div 
            className="rounded-full relative"
            style={{ 
              width: eyeSize * 1.5, 
              height: eyeSize,
              backgroundColor: appearance.eyeColor === 'heterochromia' ? eyeColorSecondary : eyeColorPrimary,
            }}
          >
            <div 
              className="absolute rounded-full bg-black"
              style={{ 
                width: eyeSize * 0.5,
                height: eyeSize * 0.7,
                top: '15%',
                left: '35%',
              }}
            />
          </div>
        </div>

        {/* Nose */}
        <div 
          className="absolute top-[55%] left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${eyeSize * 0.4}px solid transparent`,
            borderRight: `${eyeSize * 0.4}px solid transparent`,
            borderTop: `${eyeSize * 0.5}px solid #FCA5A5`,
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

        {/* Whiskers */}
        {(appearance.facialFeature === 'whiskers_long' || appearance.facialFeature === 'normal') && (
          <>
            <div className="absolute top-[58%] left-0 w-[25%] h-[1px] bg-muted-foreground/40" />
            <div className="absolute top-[55%] left-0 w-[20%] h-[1px] bg-muted-foreground/40 -rotate-12" />
            <div className="absolute top-[58%] right-0 w-[25%] h-[1px] bg-muted-foreground/40" />
            <div className="absolute top-[55%] right-0 w-[20%] h-[1px] bg-muted-foreground/40 rotate-12" />
          </>
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
