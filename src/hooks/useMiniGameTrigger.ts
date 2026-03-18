import { useState, useEffect, useCallback, useRef } from 'react';
import type { MiniGameType } from '@/components/game/minigames';

const GAME_TYPES: MiniGameType[] = ['yarn', 'nap', 'treats', 'whack', 'memory'];
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const MAX_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes

function randomInterval() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

export function useMiniGameTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState<MiniGameType>('yarn');
  const lastGameRef = useRef<MiniGameType | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const pickGame = useCallback(() => {
    const filtered = GAME_TYPES.filter((g) => g !== lastGameRef.current);
    const game = filtered[Math.floor(Math.random() * filtered.length)];
    lastGameRef.current = game;
    return game;
  }, []);

  const triggerGame = useCallback(() => {
    setCurrentGame(pickGame());
    setIsOpen(true);
  }, [pickGame]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      triggerGame();
    }, randomInterval());
  }, [triggerGame]);

  const closeGame = useCallback(() => {
    setIsOpen(false);
    scheduleNext();
  }, [scheduleNext]);

  // Start the cycle
  useEffect(() => {
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  return {
    isOpen,
    currentGame,
    closeGame,
    triggerGame, // manual trigger for testing
  };
}
