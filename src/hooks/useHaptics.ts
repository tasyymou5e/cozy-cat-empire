import { useCallback } from 'react';
import { useIsMobile } from './use-mobile';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10, 50, 30],  // Triple pulse for success
  warning: [30, 30, 30],           // Double pulse for warning
  error: [50, 100, 50],            // Long vibration for error
};

export function useHaptics() {
  const isMobile = useIsMobile();

  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    // Check if vibration API is supported and we're on mobile
    if (!isMobile || !navigator.vibrate) return;
    
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  }, [isMobile]);

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
    isSupported: isMobile && typeof navigator !== 'undefined' && 'vibrate' in navigator
  };
}
