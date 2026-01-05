import { useState, useCallback, useEffect } from 'react';
import { WheelState, WheelPrize, selectRandomPrize, getTodayDateString } from '@/types/luckyWheel';

interface UseLuckyWheelReturn {
  canSpin: boolean;
  spinsRemaining: number;
  isSpinning: boolean;
  lastPrize: WheelPrize | null;
  totalSpins: number;
  spin: () => WheelPrize | null;
  clearLastPrize: () => void;
}

const STORAGE_KEY = 'cat-farm-lucky-wheel';
const FREE_SPINS_PER_DAY = 1;
const MAX_SPINS_PER_DAY = 3;

function getInitialState(): WheelState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed: WheelState = JSON.parse(stored);
    // Reset if new day
    if (parsed.lastSpinDate !== getTodayDateString()) {
      return {
        ...parsed,
        lastSpinDate: null,
        spinsToday: 0,
      };
    }
    return parsed;
  }
  return {
    lastSpinDate: null,
    spinsToday: 0,
    totalSpins: 0,
    bestPrize: null,
  };
}

export function useLuckyWheel(isVIP: boolean = false): UseLuckyWheelReturn {
  const [state, setState] = useState<WheelState>(getInitialState);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<WheelPrize | null>(null);

  // VIP gets extra free spin
  const freeSpins = isVIP ? FREE_SPINS_PER_DAY + 1 : FREE_SPINS_PER_DAY;
  const spinsRemaining = Math.max(0, freeSpins - state.spinsToday);
  const canSpin = spinsRemaining > 0 && !isSpinning;

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check for new day
  useEffect(() => {
    const today = getTodayDateString();
    if (state.lastSpinDate && state.lastSpinDate !== today) {
      setState(prev => ({
        ...prev,
        lastSpinDate: null,
        spinsToday: 0,
      }));
    }
  }, [state.lastSpinDate]);

  const spin = useCallback((): WheelPrize | null => {
    if (!canSpin) return null;

    setIsSpinning(true);
    
    const prize = selectRandomPrize();
    
    setState(prev => {
      const newBestPrize = !prev.bestPrize || 
        getRarityValue(prize.rarity) > getRarityValue(prev.bestPrize) 
          ? prize.rarity 
          : prev.bestPrize;
      
      return {
        lastSpinDate: getTodayDateString(),
        spinsToday: prev.spinsToday + 1,
        totalSpins: prev.totalSpins + 1,
        bestPrize: newBestPrize,
      };
    });

    // Simulate spin animation delay
    setTimeout(() => {
      setLastPrize(prize);
      setIsSpinning(false);
    }, 3000);

    return prize;
  }, [canSpin]);

  const clearLastPrize = useCallback(() => {
    setLastPrize(null);
  }, []);

  return {
    canSpin,
    spinsRemaining,
    isSpinning,
    lastPrize,
    totalSpins: state.totalSpins,
    spin,
    clearLastPrize,
  };
}

function getRarityValue(rarity: string): number {
  const values: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    ultra_rare: 4,
    legendary: 5,
  };
  return values[rarity] || 0;
}
