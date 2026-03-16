/**
 * @fileoverview Player-level prestige (New Game+) system
 *
 * After reaching endgame milestones, players can reset their farm
 * in exchange for permanent multipliers that persist across resets.
 *
 * @module hooks/usePlayerPrestige
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cat-farm-player-prestige';

export interface PlayerPrestigeState {
  /** Current prestige level (0 = never prestiged) */
  level: number;
  /** Permanent coin earnings multiplier (e.g., 1.1 = +10%) */
  coinMultiplier: number;
  /** Permanent XP multiplier */
  xpMultiplier: number;
  /** Starting bonus coins on next reset */
  startingCoins: number;
  /** Total resets performed */
  totalResets: number;
}

export const PLAYER_PRESTIGE_LEVELS = [
  { level: 1, name: 'New Game+', coinMultiplier: 1.1, xpMultiplier: 1.1, startingCoins: 200, requirement: 'Day 100 + $10,000 earned' },
  { level: 2, name: 'New Game++', coinMultiplier: 1.25, xpMultiplier: 1.25, startingCoins: 500, requirement: 'Day 100 + all breeds collected' },
  { level: 3, name: 'Legendary', coinMultiplier: 1.5, xpMultiplier: 1.5, startingCoins: 1000, requirement: 'Day 100 + 50 show wins' },
] as const;

interface PrestigeCheckStats {
  day: number;
  totalMoneyEarned: number;
  totalShowWins: number;
  allBreedsCollected: boolean;
}

export interface UsePlayerPrestigeReturn {
  prestige: PlayerPrestigeState;
  canPrestige: (stats: PrestigeCheckStats) => boolean;
  getNextPrestigeInfo: () => (typeof PLAYER_PRESTIGE_LEVELS)[number] | null;
  performPrestige: () => PlayerPrestigeState | null;
}

function getDefaultState(): PlayerPrestigeState {
  return { level: 0, coinMultiplier: 1, xpMultiplier: 1, startingCoins: 0, totalResets: 0 };
}

export function usePlayerPrestige(): UsePlayerPrestigeReturn {
  const [prestige, setPrestige] = useState<PlayerPrestigeState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : getDefaultState();
    } catch {
      return getDefaultState();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prestige));
  }, [prestige]);

  const canPrestige = useCallback((stats: PrestigeCheckStats): boolean => {
    const nextLevel = prestige.level + 1;
    if (nextLevel > PLAYER_PRESTIGE_LEVELS.length) return false;

    if (stats.day < 100) return false;

    const levelDef = PLAYER_PRESTIGE_LEVELS[prestige.level];
    if (!levelDef) return false;

    switch (prestige.level) {
      case 0: return stats.totalMoneyEarned >= 10000;
      case 1: return stats.allBreedsCollected;
      case 2: return stats.totalShowWins >= 50;
      default: return false;
    }
  }, [prestige.level]);

  const getNextPrestigeInfo = useCallback(() => {
    if (prestige.level >= PLAYER_PRESTIGE_LEVELS.length) return null;
    return PLAYER_PRESTIGE_LEVELS[prestige.level];
  }, [prestige.level]);

  const performPrestige = useCallback(() => {
    const nextDef = PLAYER_PRESTIGE_LEVELS[prestige.level];
    if (!nextDef) return null;

    const newState: PlayerPrestigeState = {
      level: nextDef.level,
      coinMultiplier: nextDef.coinMultiplier,
      xpMultiplier: nextDef.xpMultiplier,
      startingCoins: nextDef.startingCoins,
      totalResets: prestige.totalResets + 1,
    };

    setPrestige(newState);
    return newState;
  }, [prestige]);

  return { prestige, canPrestige, getNextPrestigeInfo, performPrestige };
}
