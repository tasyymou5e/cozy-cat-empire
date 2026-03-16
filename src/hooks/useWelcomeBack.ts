/**
 * @fileoverview Welcome-back bonus hook for lapsed players
 *
 * Detects if the player has been away for 3+ days and offers
 * a catch-up bonus (coins + free wheel spins) that scales with time away.
 *
 * @module hooks/useWelcomeBack
 */

import { useState, useEffect, useCallback } from 'react';
import type { WelcomeBackBonus } from '@/components/game/WelcomeBackDialog';

const STORAGE_KEY = 'cat-farm-last-session';
const MIN_DAYS_AWAY = 3;
const MAX_BONUS_DAYS = 7;
const COINS_PER_DAY = 50;
const SPINS_PER_2_DAYS = 1;

export interface UseWelcomeBackReturn {
  showWelcomeBack: boolean;
  welcomeBackBonus: WelcomeBackBonus | null;
  claimWelcomeBack: () => WelcomeBackBonus | null;
  dismissWelcomeBack: () => void;
}

export function useWelcomeBack(): UseWelcomeBackReturn {
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [welcomeBackBonus, setWelcomeBackBonus] = useState<WelcomeBackBonus | null>(null);

  useEffect(() => {
    const lastSession = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastSession) {
      const lastDate = parseInt(lastSession, 10);
      const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff >= MIN_DAYS_AWAY) {
        const cappedDays = Math.min(daysDiff, MAX_BONUS_DAYS);
        const coins = cappedDays * COINS_PER_DAY;
        const freeSpins = Math.floor(cappedDays / 2) + 1;

        setWelcomeBackBonus({ coins, freeSpins, daysAway: daysDiff });
        setShowWelcomeBack(true);
      }
    }

    // Always update the session timestamp
    localStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  const claimWelcomeBack = useCallback(() => {
    setShowWelcomeBack(false);
    return welcomeBackBonus;
  }, [welcomeBackBonus]);

  const dismissWelcomeBack = useCallback(() => {
    setShowWelcomeBack(false);
  }, []);

  return {
    showWelcomeBack,
    welcomeBackBonus,
    claimWelcomeBack,
    dismissWelcomeBack,
  };
}
