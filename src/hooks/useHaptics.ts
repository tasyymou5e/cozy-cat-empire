import { useCallback } from 'react';
import { useIsMobile } from './use-mobile';

/** Available haptic feedback patterns */
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/** Vibration patterns in milliseconds for each haptic type */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10, 50, 30], // Triple pulse for success
  warning: [30, 30, 30], // Double pulse for warning
  error: [50, 100, 50], // Long vibration for error
};

/**
 * Hook for haptic feedback on mobile devices
 *
 * Provides vibration patterns for different game events like progress,
 * completion, and achievements. Only activates on mobile devices with
 * vibration API support.
 *
 * @returns Haptic feedback functions and support status
 *
 * @example
 * ```tsx
 * const { vibrate, vibrateComplete, isSupported } = useHaptics();
 *
 * // Simple vibration
 * vibrate('light');
 *
 * // Achievement celebration pattern
 * vibrateAchievement();
 *
 * // Check if haptics are available
 * if (isSupported) {
 *   vibrateProgress();
 * }
 * ```
 */
export function useHaptics() {
  const isMobile = useIsMobile();

  const vibrate = useCallback(
    (pattern: HapticPattern = 'light') => {
      // Check if vibration API is supported and we're on mobile
      if (!isMobile || !navigator.vibrate) return;

      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
    },
    [isMobile]
  );

  const vibrateProgress = useCallback(() => {
    vibrate('light');
  }, [vibrate]);

  const vibrateComplete = useCallback(() => {
    vibrate('success');
  }, [vibrate]);

  const vibrateAchievement = useCallback(() => {
    vibrate('heavy');
    setTimeout(() => vibrate('success'), 200);
  }, [vibrate]);

  return {
    vibrate,
    vibrateProgress,
    vibrateComplete,
    vibrateAchievement,
    isSupported: isMobile && typeof navigator !== 'undefined' && 'vibrate' in navigator,
  };
}
