import { useState, useCallback, useEffect } from 'react';
import { WheelState, WheelPrize, selectRandomPrize, getTodayDateString } from '@/types/luckyWheel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBroadcastSync, SYNC_MESSAGES } from './useBroadcastSync';

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

function getInitialState(): WheelState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed: WheelState = JSON.parse(stored);
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
  const { user } = useAuth();
  const [state, setState] = useState<WheelState>(getInitialState);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<WheelPrize | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Cross-tab sync for wheel spins
  const { broadcast } = useBroadcastSync<{ spinsToday: number }>('lucky-wheel-sync', (msg) => {
    if (msg.type === SYNC_MESSAGES.WHEEL_SPUN) {
      // Another tab spun the wheel, update our state
      setState((prev) => ({
        ...prev,
        spinsToday: Math.max(prev.spinsToday, msg.payload?.spinsToday || 0),
      }));
    }
  });

  const freeSpins = isVIP ? FREE_SPINS_PER_DAY + 1 : FREE_SPINS_PER_DAY;
  const spinsRemaining = Math.max(0, freeSpins - state.spinsToday);
  const canSpin = spinsRemaining > 0 && !isSpinning;

  // Load from cloud on mount
  useEffect(() => {
    if (!user?.id || cloudLoaded) return;

    const loadFromCloud = async () => {
      const { data } = await supabase
        .from('player_progress')
        .select('last_spin_date, spins_today, total_spins, best_prize')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const today = getTodayDateString();
        const cloudLastSpinDate = data.last_spin_date;
        const isNewDay = cloudLastSpinDate !== today;

        const cloudState: WheelState = {
          lastSpinDate: isNewDay ? null : cloudLastSpinDate,
          spinsToday: isNewDay ? 0 : data.spins_today || 0,
          totalSpins: Math.max(state.totalSpins, data.total_spins || 0),
          bestPrize: data.best_prize as WheelState['bestPrize'],
        };

        setState(cloudState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
      }
      setCloudLoaded(true);
    };

    loadFromCloud();
  }, [user?.id, cloudLoaded]);

  // Sync to cloud when state changes
  useEffect(() => {
    if (!user?.id || !cloudLoaded) return;

    const syncToCloud = async () => {
      await supabase.from('player_progress').upsert(
        {
          user_id: user.id,
          last_spin_date: state.lastSpinDate,
          spins_today: state.spinsToday,
          total_spins: state.totalSpins,
          best_prize: state.bestPrize,
        },
        { onConflict: 'user_id' }
      );
    };

    syncToCloud();
  }, [user?.id, state, cloudLoaded]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check for new day
  useEffect(() => {
    const today = getTodayDateString();
    if (state.lastSpinDate && state.lastSpinDate !== today) {
      setState((prev) => ({
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

    setState((prev) => {
      const newBestPrize =
        !prev.bestPrize || getRarityValue(prize.rarity) > getRarityValue(prev.bestPrize)
          ? prize.rarity
          : prev.bestPrize;

      const newState = {
        lastSpinDate: getTodayDateString(),
        spinsToday: prev.spinsToday + 1,
        totalSpins: prev.totalSpins + 1,
        bestPrize: newBestPrize,
      };

      // Broadcast to other tabs
      broadcast({ type: SYNC_MESSAGES.WHEEL_SPUN, payload: { spinsToday: newState.spinsToday } });

      return newState;
    });

    setTimeout(() => {
      setLastPrize(prize);
      setIsSpinning(false);
    }, 3000);

    return prize;
  }, [canSpin, broadcast]);

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
