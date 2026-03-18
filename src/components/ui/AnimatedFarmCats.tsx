import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuthSounds } from '@/hooks/useAuthSounds';

interface AnimatedFarmCatsProps {
  className?: string;
  count?: number;
  interactive?: boolean;
  soundEnabled?: boolean;
}

type CatType = 'tabby' | 'gray' | 'white' | 'calico';

const CAT_REACTIONS: Record<CatType, { text: string; emoji: string }> = {
  tabby: { text: 'Mrrp!', emoji: '💕' },
  gray: { text: 'Purrrr~', emoji: '😻' },
  white: { text: 'Nya!', emoji: '✨' },
  calico: { text: 'Zzz...?', emoji: '😴' },
};

interface CatReactionBubbleProps {
  catType: CatType;
  visible: boolean;
}

// SVG Cat designs
const OrangeTabbyCat = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 50" className={cn("w-20 h-12", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="40" cy="35" rx="22" ry="14" fill="#F4A460"/>
    <ellipse cx="40" cy="35" rx="22" ry="14" fill="url(#tabbyStripes)" fillOpacity="0.3"/>
    {/* Legs */}
    <ellipse cx="25" cy="44" rx="5" ry="6" fill="#E8954B"/>
    <ellipse cx="55" cy="44" rx="5" ry="6" fill="#E8954B"/>
    {/* Head */}
    <circle cx="65" cy="28" r="12" fill="#F4A460"/>
    {/* Ears */}
    <path d="M58 18 L56 8 L64 14 Z" fill="#F4A460"/>
    <path d="M72 18 L74 8 L66 14 Z" fill="#F4A460"/>
    <path d="M58 18 L57 10 L63 14 Z" fill="#FFB6C1"/>
    <path d="M72 18 L73 10 L67 14 Z" fill="#FFB6C1"/>
    {/* Eyes */}
    <circle cx="61" cy="26" r="3" fill="white"/>
    <circle cx="69" cy="26" r="3" fill="white"/>
    <circle cx="62" cy="26" r="2" fill="#2D5016"/>
    <circle cx="70" cy="26" r="2" fill="#2D5016"/>
    <circle cx="62.5" cy="25.5" r="0.8" fill="white"/>
    <circle cx="70.5" cy="25.5" r="0.8" fill="white"/>
    {/* Nose */}
    <ellipse cx="65" cy="31" rx="2" ry="1.5" fill="#FFB6C1"/>
    {/* Whiskers */}
    <line x1="52" y1="30" x2="58" y2="29" stroke="#8B4513" strokeWidth="0.5"/>
    <line x1="52" y1="32" x2="58" y2="32" stroke="#8B4513" strokeWidth="0.5"/>
    <line x1="72" y1="29" x2="78" y2="30" stroke="#8B4513" strokeWidth="0.5"/>
    <line x1="72" y1="32" x2="78" y2="32" stroke="#8B4513" strokeWidth="0.5"/>
    {/* Tail */}
    <path d="M18 30 Q8 20 12 10" stroke="#F4A460" strokeWidth="6" strokeLinecap="round" className="animate-tail-swish origin-[18px_30px]"/>
    <defs>
      <pattern id="tabbyStripes" patternUnits="userSpaceOnUse" width="8" height="8">
        <path d="M0 4 L8 4" stroke="#CD853F" strokeWidth="2"/>
      </pattern>
    </defs>
  </svg>
);

const GrayCat = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 55" className={cn("w-14 h-14", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body (sitting) */}
    <ellipse cx="30" cy="38" rx="18" ry="16" fill="#9CA3AF"/>
    {/* Front paws */}
    <ellipse cx="22" cy="48" rx="5" ry="4" fill="#6B7280"/>
    <ellipse cx="38" cy="48" rx="5" ry="4" fill="#6B7280"/>
    {/* Head */}
    <circle cx="30" cy="18" r="14" fill="#9CA3AF"/>
    {/* Ears */}
    <path d="M18 10 L14 -2 L26 6 Z" fill="#9CA3AF"/>
    <path d="M42 10 L46 -2 L34 6 Z" fill="#9CA3AF"/>
    <path d="M19 9 L16 0 L25 6 Z" fill="#FFB6C1"/>
    <path d="M41 9 L44 0 L35 6 Z" fill="#FFB6C1"/>
    {/* Eyes */}
    <ellipse cx="24" cy="16" rx="4" ry="4.5" fill="white"/>
    <ellipse cx="36" cy="16" rx="4" ry="4.5" fill="white"/>
    <circle cx="25" cy="16" r="2.5" fill="#3B82F6"/>
    <circle cx="37" cy="16" r="2.5" fill="#3B82F6"/>
    <circle cx="25.8" cy="15" r="1" fill="white"/>
    <circle cx="37.8" cy="15" r="1" fill="white"/>
    {/* Nose */}
    <path d="M28 22 L30 25 L32 22 Z" fill="#FFB6C1"/>
    {/* Mouth */}
    <path d="M30 25 Q28 28 26 27" stroke="#6B7280" strokeWidth="0.8" fill="none"/>
    <path d="M30 25 Q32 28 34 27" stroke="#6B7280" strokeWidth="0.8" fill="none"/>
    {/* Tail curled */}
    <path d="M48 35 Q58 30 55 20 Q52 12 45 15" stroke="#9CA3AF" strokeWidth="5" strokeLinecap="round" fill="none"/>
  </svg>
);

const WhiteFluffyCat = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 70 55" className={cn("w-16 h-14", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fluffy body */}
    <ellipse cx="35" cy="38" rx="24" ry="16" fill="#FEFEFE"/>
    <circle cx="18" cy="35" r="8" fill="#FEFEFE"/>
    <circle cx="52" cy="35" r="8" fill="#FEFEFE"/>
    <circle cx="35" cy="48" r="6" fill="#FEFEFE"/>
    {/* Head */}
    <circle cx="35" cy="18" r="16" fill="#FEFEFE"/>
    <circle cx="23" cy="12" r="5" fill="#FEFEFE"/>
    <circle cx="47" cy="12" r="5" fill="#FEFEFE"/>
    {/* Ears */}
    <path d="M18 8 L16 -4 L28 4 Z" fill="#FEFEFE"/>
    <path d="M52 8 L54 -4 L42 4 Z" fill="#FEFEFE"/>
    <path d="M19 7 L18 -1 L26 4 Z" fill="#FFE4E1"/>
    <path d="M51 7 L52 -1 L44 4 Z" fill="#FFE4E1"/>
    {/* Eyes */}
    <ellipse cx="28" cy="18" rx="4" ry="5" fill="#87CEEB"/>
    <ellipse cx="42" cy="18" rx="4" ry="5" fill="#87CEEB"/>
    <circle cx="29" cy="17" r="1.5" fill="white"/>
    <circle cx="43" cy="17" r="1.5" fill="white"/>
    <ellipse cx="28" cy="20" rx="2" ry="3" fill="#1E3A5F"/>
    <ellipse cx="42" cy="20" rx="2" ry="3" fill="#1E3A5F"/>
    {/* Nose */}
    <ellipse cx="35" cy="24" rx="2.5" ry="2" fill="#FFB6C1"/>
    {/* Blush */}
    <ellipse cx="22" cy="24" rx="3" ry="2" fill="#FFE4E1"/>
    <ellipse cx="48" cy="24" rx="3" ry="2" fill="#FFE4E1"/>
    {/* Paws */}
    <ellipse cx="25" cy="50" rx="5" ry="4" fill="#F5F5F5"/>
    <ellipse cx="45" cy="50" rx="5" ry="4" fill="#F5F5F5"/>
  </svg>
);

const CalicoCat = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 65 40" className={cn("w-16 h-10", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sleeping body (curled up) */}
    <ellipse cx="32" cy="28" rx="28" ry="12" fill="#FEFEFE"/>
    <ellipse cx="15" cy="26" rx="10" ry="8" fill="#F4A460"/>
    <ellipse cx="48" cy="26" rx="8" ry="6" fill="#2D2D2D"/>
    {/* Head tucked */}
    <circle cx="50" cy="22" r="10" fill="#FEFEFE"/>
    <ellipse cx="45" cy="20" rx="5" ry="4" fill="#F4A460"/>
    {/* Ears */}
    <path d="M44 14 L42 6 L48 10 Z" fill="#FEFEFE"/>
    <path d="M56 14 L58 6 L52 10 Z" fill="#2D2D2D"/>
    {/* Closed eyes (sleeping) */}
    <path d="M46 22 Q48 20 50 22" stroke="#333" strokeWidth="1.5" fill="none"/>
    <path d="M52 22 Q54 20 56 22" stroke="#333" strokeWidth="1.5" fill="none"/>
    {/* Nose */}
    <ellipse cx="51" cy="25" rx="1.5" ry="1" fill="#FFB6C1"/>
    {/* Tail wrapped around */}
    <path d="M5 25 Q0 15 10 12 Q20 10 25 18" stroke="#2D2D2D" strokeWidth="4" strokeLinecap="round" fill="none"/>
    {/* Zzz */}
    <text x="58" y="10" fill="#9CA3AF" fontSize="8" fontFamily="sans-serif" className="animate-pulse">z</text>
    <text x="62" y="6" fill="#9CA3AF" fontSize="6" fontFamily="sans-serif" className="animate-pulse" style={{ animationDelay: '0.2s' }}>z</text>
  </svg>
);

// Reaction bubble component
function CatReactionBubble({ catType, visible }: CatReactionBubbleProps) {
  if (!visible) return null;
  
  const reaction = CAT_REACTIONS[catType];
  
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce-in z-10">
      <div className="bg-card/95 rounded-full px-3 py-1.5 shadow-lg border border-white/50 whitespace-nowrap">
        <span className="text-sm font-medium text-foreground/80 ">
          {reaction.text} {reaction.emoji}
        </span>
      </div>
    </div>
  );
}

// Interactive cat wrapper
interface InteractiveCatProps {
  Cat: React.ComponentType<{ className?: string }>;
  catType: CatType;
  className?: string;
  interactive?: boolean;
  soundEnabled?: boolean;
  onHover?: (catType: CatType) => void;
}

function InteractiveCat({ Cat, catType, className, interactive, soundEnabled, onHover }: InteractiveCatProps) {
  const [showReaction, setShowReaction] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    setIsHovered(true);
    setShowReaction(true);
    onHover?.(catType);
    
    // Hide reaction after 2 seconds
    setTimeout(() => setShowReaction(false), 2000);
  }, [interactive, catType, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div 
      className={cn(
        "relative",
        interactive && "pointer-events-auto cursor-pointer"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CatReactionBubble catType={catType} visible={showReaction} />
      <div className={cn(
        "transition-all duration-200",
        isHovered && interactive && "scale-110 drop-shadow-[0_0_8px_rgba(255,182,193,0.6)]"
      )}>
        <Cat className={className} />
      </div>
    </div>
  );
}

// Cat animation configurations
const CAT_CONFIGS: Array<{
  Cat: React.ComponentType<{ className?: string }>;
  catType: CatType;
  animation: string;
  duration: string;
  bottom: string;
  position?: 'left' | 'right';
  delay: string;
}> = [
  { Cat: OrangeTabbyCat, catType: 'tabby', animation: 'walk-left-to-right', duration: '25s', bottom: '3%', delay: '0s' },
  { Cat: GrayCat, catType: 'gray', animation: 'cat-idle', duration: '3s', bottom: '8%', position: 'left', delay: '0s' },
  { Cat: WhiteFluffyCat, catType: 'white', animation: 'walk-right-to-left', duration: '30s', bottom: '5%', delay: '5s' },
  { Cat: CalicoCat, catType: 'calico', animation: 'cat-sleep', duration: '4s', bottom: '2%', position: 'right', delay: '0s' },
];

export function AnimatedFarmCats({ 
  className, 
  count = 4, 
  interactive = true, 
  soundEnabled = true 
}: AnimatedFarmCatsProps) {
  const { playCatSound } = useAuthSounds();
  
  const cats = useMemo(() => {
    return CAT_CONFIGS.slice(0, Math.min(count, CAT_CONFIGS.length));
  }, [count]);

  const handleCatHover = useCallback((catType: CatType) => {
    if (soundEnabled) {
      playCatSound(catType);
    }
  }, [soundEnabled, playCatSound]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden z-[5]", className)}>
      {cats.map((config, index) => {
        const { Cat, catType, animation, duration, bottom, position, delay } = config;
        
        // Walking cats
        if (animation === 'walk-left-to-right') {
          return (
            <div
              key={index}
              className="absolute animate-walk-left-to-right"
              style={{
                bottom,
                animationDuration: duration,
                animationDelay: delay,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            >
              <InteractiveCat 
                Cat={Cat} 
                catType={catType} 
                interactive={interactive}
                soundEnabled={soundEnabled}
                onHover={handleCatHover}
              />
            </div>
          );
        }
        
        if (animation === 'walk-right-to-left') {
          return (
            <div
              key={index}
              className="absolute animate-walk-right-to-left"
              style={{
                bottom,
                animationDuration: duration,
                animationDelay: delay,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            >
              <InteractiveCat 
                Cat={Cat} 
                catType={catType}
                className="scale-x-[-1]"
                interactive={interactive}
                soundEnabled={soundEnabled}
                onHover={handleCatHover}
              />
            </div>
          );
        }
        
        // Sitting/idle cats in corners
        if (animation === 'cat-idle') {
          return (
            <div
              key={index}
              className="absolute animate-cat-idle"
              style={{
                bottom,
                left: position === 'left' ? '5%' : undefined,
                right: position === 'right' ? '5%' : undefined,
                animationDuration: duration,
                animationIterationCount: 'infinite',
              }}
            >
              <InteractiveCat 
                Cat={Cat} 
                catType={catType}
                interactive={interactive}
                soundEnabled={soundEnabled}
                onHover={handleCatHover}
              />
            </div>
          );
        }
        
        // Sleeping cat
        if (animation === 'cat-sleep') {
          return (
            <div
              key={index}
              className="absolute animate-cat-breathe"
              style={{
                bottom,
                left: position === 'left' ? '8%' : undefined,
                right: position === 'right' ? '8%' : undefined,
                animationDuration: duration,
                animationIterationCount: 'infinite',
              }}
            >
              <InteractiveCat 
                Cat={Cat} 
                catType={catType}
                interactive={interactive}
                soundEnabled={soundEnabled}
                onHover={handleCatHover}
              />
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
}
