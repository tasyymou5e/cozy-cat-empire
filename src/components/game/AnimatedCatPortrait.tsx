/**
 * AnimatedCatPortrait - Lottie + CSS animation wrapper for cat portraits
 *
 * Wraps any cat portrait/avatar with micro-interactions:
 * - Kawaii: breathing (scale), ear twitch, whisker flicker, Lottie blink
 * - Realistic: head tilt, whisker flicker, Lottie blink
 * - Hover zoom effect on both styles
 * - Cross-fade on mount
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMicroAnimations } from '@/hooks/useMicroAnimations';
import type { PortraitStyle } from '@/config/portraitSettings';

// Lazy-load Lottie for code splitting
const Lottie = lazy(() => import('lottie-react'));

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

  // Lazy import of animation data
  const [blinkData, setBlinkData] = useState<object | null>(null);
  useEffect(() => {
    if (!enableAnimations) return;
    const file = style === 'kawaii' ? '/animations/kawaii-blink.json' : '/animations/realistic-blink.json';
    fetch(file)
      .then((r) => r.json())
      .then(setBlinkData)
      .catch(() => {
        // Silently fail - blink overlay is optional
      });
  }, [style, enableAnimations]);

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

      {/* Lottie blink overlay */}
      {isBlinking && blinkData && enableAnimations && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <Suspense fallback={null}>
            <Lottie
              animationData={blinkData}
              loop={false}
              autoplay
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default AnimatedCatPortrait;
