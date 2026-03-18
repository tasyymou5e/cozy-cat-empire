/**
 * useMicroAnimations Hook
 *
 * Manages randomized per-cat micro-interactions: blink, ear twitch,
 * whisker flicker, breathing, and head tilt. Respects prefers-reduced-motion.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortraitStyle } from '@/config/portraitSettings';

interface UseMicroAnimationsOptions {
  style: PortraitStyle;
  enabled: boolean;
}

interface UseMicroAnimationsReturn {
  /** Whether blink animation should play right now */
  isBlinking: boolean;
  /** Whether whisker flicker is active (synced with blink) */
  whiskerFlicker: boolean;
  /** Whether ear twitch is active (kawaii only) */
  earTwitchActive: boolean;
  /** CSS class string for the continuous animation (breathing or head-tilt) */
  continuousClass: string;
  /** Trigger a manual blink */
  triggerBlink: () => void;
}

export function useMicroAnimations({
  style,
  enabled,
}: UseMicroAnimationsOptions): UseMicroAnimationsReturn {
  const [isBlinking, setIsBlinking] = useState(false);
  const [whiskerFlicker, setWhiskerFlicker] = useState(false);
  const [earTwitchActive, setEarTwitchActive] = useState(false);

  // Randomized offsets per-cat instance (stable across renders)
  const blinkIntervalRef = useRef(4000 + Math.random() * 4000); // 4-8s
  const twitchIntervalRef = useRef(3000 + Math.random() * 2000); // 3-5s

  // Check prefers-reduced-motion
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isActive = enabled && !prefersReduced;

  const triggerBlink = useCallback(() => {
    if (!isActive) return;
    setIsBlinking(true);
    setWhiskerFlicker(true);
    // Blink lasts ~300ms (Lottie handles the visual, this controls the overlay)
    setTimeout(() => {
      setIsBlinking(false);
    }, 350);
    setTimeout(() => {
      setWhiskerFlicker(false);
    }, 300);
  }, [isActive]);

  // Blink timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      triggerBlink();
      // Randomize next interval slightly
      blinkIntervalRef.current = 4000 + Math.random() * 4000;
    }, blinkIntervalRef.current);
    return () => clearInterval(interval);
  }, [isActive, triggerBlink]);

  // Ear twitch timer (kawaii only)
  useEffect(() => {
    if (!isActive || style !== 'kawaii') return;
    const interval = setInterval(() => {
      setEarTwitchActive(true);
      setTimeout(() => setEarTwitchActive(false), 300);
      twitchIntervalRef.current = 3000 + Math.random() * 2000;
    }, twitchIntervalRef.current);
    return () => clearInterval(interval);
  }, [isActive, style]);

  // Continuous animation class
  const continuousClass = isActive
    ? style === 'kawaii'
      ? 'animate-kawaii-breathe'
      : 'animate-realistic-head-tilt'
    : '';

  return {
    isBlinking,
    whiskerFlicker,
    earTwitchActive,
    continuousClass,
    triggerBlink,
  };
}

export default useMicroAnimations;
