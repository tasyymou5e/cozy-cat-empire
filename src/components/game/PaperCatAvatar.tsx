/**
 * PaperCatAvatar - High-quality vector cat avatar using Paper.js
 *
 * This component generates detailed vector cat faces programmatically
 * using Paper.js. It supports all appearance options and creates
 * breed-specific shapes for each cat type.
 * 
 * Paper.js is lazy-loaded to reduce initial bundle size.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Cat } from '@/types/game';
import { generateFullAvatarHash, getCachedAvatar, setCachedAvatar } from '@/lib/avatarCache';
import { CatAvatar } from './CatAvatar';
import { AnimatedCostumeSVG } from './AnimatedCostumeSVG';
import { cn } from '@/lib/utils';
import { GRAPHICS_CONFIG } from '@/config/graphics';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import { COSTUME_VECTORS } from '@/lib/costumeVectors';
import { COSTUMES } from '@/types/costumes';

import { createLogger } from '@/lib/logger';

const logger = createLogger('PaperCatAvatar');

// Type for the dynamically imported function
type GenerateCatAvatarUrlFn = (
  cat: Cat,
  costumeId?: string,
  size?: string,
  portraitStyle?: 'kawaii' | 'realistic'
) => string | null;

export interface PaperCatAvatarProps {
  cat: Cat;
  equippedCostumeId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCostume?: boolean;
  animated?: boolean;
  className?: string;
  /** Portrait art style for vector rendering */
  portraitStyle?: 'realistic' | 'kawaii';
}

const sizeClasses: Record<string, string> = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const costumeSizeClasses: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function PaperCatAvatar({
  cat,
  equippedCostumeId,
  size = 'md',
  showCostume = true,
  animated = false,
  className,
  portraitStyle = 'kawaii',
}: PaperCatAvatarProps) {
  const { settings } = useGraphicsSettings();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // State for the dynamically loaded generator function
  const [generateFn, setGenerateFn] = useState<GenerateCatAvatarUrlFn | null>(null);
  const [isModuleLoaded, setIsModuleLoaded] = useState(false);

  // Generate hash for caching (includes style)
  const avatarHash = useMemo(() => {
    return generateFullAvatarHash(cat, equippedCostumeId, `${size}-${portraitStyle}`);
  }, [cat, equippedCostumeId, size, portraitStyle]);

  // Dynamically import the Paper.js generator module
  useEffect(() => {
    if (GRAPHICS_CONFIG.vectorEngine !== 'paperjs') {
      setHasError(true);
      setIsModuleLoaded(true);
      return;
    }

    let isMounted = true;

    import('@/lib/catVectorGenerator')
      .then((module) => {
        if (isMounted) {
          setGenerateFn(() => module.generateCatAvatarUrl);
          setIsModuleLoaded(true);
        }
      })
      .catch((error) => {
        logger.error('Failed to load catVectorGenerator:', error);
        if (isMounted) {
          setHasError(true);
          setIsModuleLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Generate or retrieve cached avatar once module is loaded
  useEffect(() => {
    if (!generateFn || !isModuleLoaded) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Check cache first
    if (GRAPHICS_CONFIG.cacheGeneratedAvatars) {
      const cached = getCachedAvatar(avatarHash);
      if (cached) {
        setAvatarUrl(cached);
        setIsLoading(false);
        return;
      }
    }

    // Generate new avatar
    try {
      const url = generateFn(cat, equippedCostumeId, size, portraitStyle);
      if (url) {
        setAvatarUrl(url);
        if (GRAPHICS_CONFIG.cacheGeneratedAvatars) {
          setCachedAvatar(avatarHash, url);
        }
      } else {
        setHasError(true);
      }
    } catch (error) {
      logger.error('PaperCatAvatar generation failed:', error);
      setHasError(true);
    }

    setIsLoading(false);
  }, [generateFn, isModuleLoaded, cat, equippedCostumeId, size, avatarHash, portraitStyle]);

  // Show loading skeleton while module is being fetched
  if (!isModuleLoaded) {
    return (
      <div
        className={cn(
          'bg-muted animate-pulse rounded-full',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  // Fallback to CatAvatar on error
  if (hasError) {
    return (
      <CatAvatar
        cat={cat}
        equippedCostumeId={equippedCostumeId}
        size={size}
        showCostume={showCostume}
        animated={animated}
        className={className}
      />
    );
  }

  // Get costume info for overlay
  const costume = equippedCostumeId ? COSTUMES.find((c) => c.id === equippedCostumeId) : null;
  const vectorCostume = equippedCostumeId ? COSTUME_VECTORS[equippedCostumeId] : null;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-background to-muted',
        sizeClasses[size],
        animated && 'animate-cat-breathe',
        className
      )}
    >
      {isLoading ? (
        <div className="w-full h-full bg-muted animate-pulse rounded-full" />
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${cat.name} avatar`}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : null}

      {/* Costume Overlay */}
      {showCostume && costume && !isLoading && (
        <div className="absolute inset-0 pointer-events-none">
          {vectorCostume ? (
            // Animated vector costume (SVG)
            <AnimatedCostumeSVG
              costume={vectorCostume}
              size={size}
              isAnimated={animated && settings.enableCostumeAnimations}
            />
          ) : (
            // Emoji fallback
            <span
              className={cn(
                'absolute',
                costumeSizeClasses[size],
                costume.category === 'hat' && '-top-1 left-1/2 -translate-x-1/2',
                costume.category === 'accessory' && 'bottom-1 left-1/2 -translate-x-1/2',
                costume.category === 'outfit' && 'bottom-0 left-1/2 -translate-x-1/2',
                costume.category === 'special' && 'top-0 right-0'
              )}
            >
              {costume.emoji}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default PaperCatAvatar;
