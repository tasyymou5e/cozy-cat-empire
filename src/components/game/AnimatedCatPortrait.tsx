/**
 * AnimatedCatPortrait - CSS animation wrapper for cat portraits
 *
 * Wraps any cat portrait/avatar with micro-interactions:
 * - Eyes-only blink via CSS overlay at eye level
 * - Whisker flicker synced with blink
 * - Ear twitch (kawaii only)
 * - Hover zoom effect
 * - Cross-fade on mount
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMicroAnimations } from '@/hooks/useMicroAnimations';
import type { PortraitStyle } from '@/config/portraitSettings';

interface AnimatedCatPortraitProps {
  children: React.ReactNode;
  style: PortraitStyle;
  enableAnimations: boolean;
  className?: string;
}

export function AnimatedCatPortrait({
  children,
  style,
  enableAnimations,
  className,
}: AnimatedCatPortraitProps) {
  const { isBlinking, whiskerFlicker, earTwitchActive, continuousClass } = useMicroAnimations({
    style,
    enabled: enableAnimations,
  });

  // Cross-fade on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
        enableAnimations && 'cat-portrait-hover',
        continuousClass,
        className
      )}
    >
      {/* Main content (portrait/avatar) */}
      {children}

      {/* Whisker flicker overlay */}
      {whiskerFlicker && enableAnimations && (
        <div className="absolute inset-0 pointer-events-none animate-whisker-flicker" />
      )}

      {/* Ear twitch indicator (kawaii only) */}
      {earTwitchActive && enableAnimations && style === 'kawaii' && (
        <div className="absolute top-0 left-0 right-0 h-1/4 pointer-events-none animate-kawaii-ear-twitch origin-bottom" />
      )}

      {/* CSS eye-blink — brief opacity dip on the whole portrait */}
      {isBlinking && enableAnimations && (
        <div className="absolute inset-0 pointer-events-none z-10 animate-cat-eye-blink bg-black/30" />
      )}
    </div>
  );
}

export default AnimatedCatPortrait;
