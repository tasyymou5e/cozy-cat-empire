/**
 * @fileoverview Floating reward animation component
 *
 * Shows "+XP", "+coins" popups that float upward and fade out
 * when the player earns rewards from game actions.
 *
 * @module components/game/FloatingRewardPopup
 */

import { useEffect, useState, useCallback, useRef } from 'react';

interface RewardPopup {
  id: string;
  text: string;
  type: 'coins' | 'xp' | 'resource' | 'achievement';
  x: number;
  y: number;
}

const POPUP_DURATION = 1800;

const TYPE_STYLES: Record<RewardPopup['type'], string> = {
  coins: 'text-yellow-400 drop-shadow-[0_1px_2px_rgba(234,179,8,0.6)]',
  xp: 'text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.6)]',
  resource: 'text-green-400 drop-shadow-[0_1px_2px_rgba(74,222,128,0.6)]',
  achievement: 'text-purple-400 drop-shadow-[0_1px_2px_rgba(192,132,252,0.6)]',
};

const TYPE_EMOJI: Record<RewardPopup['type'], string> = {
  coins: '💰',
  xp: '⭐',
  resource: '📦',
  achievement: '🏆',
};

/**
 * Hook to manage floating reward popups
 */
export function useFloatingRewards() {
  const [popups, setPopups] = useState<RewardPopup[]>([]);
  const counterRef = useRef(0);

  const showReward = useCallback((text: string, type: RewardPopup['type'] = 'coins') => {
    const id = `reward-${Date.now()}-${counterRef.current++}`;
    // Random horizontal position in the center-ish area
    const x = 40 + Math.random() * 20; // 40-60% from left
    const y = 30 + Math.random() * 20; // 30-50% from top

    setPopups((prev) => [...prev, { id, text, type, x, y }]);

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, POPUP_DURATION);
  }, []);

  const showCoinReward = useCallback((amount: number) => {
    if (amount > 0) showReward(`+${amount}`, 'coins');
    else if (amount < 0) showReward(`${amount}`, 'coins');
  }, [showReward]);

  const showXPReward = useCallback((amount: number) => {
    if (amount > 0) showReward(`+${amount} XP`, 'xp');
  }, [showReward]);

  const showResourceReward = useCallback((resourceName: string, amount: number) => {
    if (amount > 0) showReward(`+${amount} ${resourceName}`, 'resource');
  }, [showReward]);

  const showAchievementReward = useCallback((name: string) => {
    showReward(name, 'achievement');
  }, [showReward]);

  return {
    popups,
    showReward,
    showCoinReward,
    showXPReward,
    showResourceReward,
    showAchievementReward,
  };
}

/**
 * Renders floating reward popups with rise + fade animation
 */
export function FloatingRewardPopups({ popups }: { popups: RewardPopup[] }) {
  if (popups.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {popups.map((popup) => (
        <div
          key={popup.id}
          className={`absolute font-bold text-lg animate-reward-float ${TYPE_STYLES[popup.type]}`}
          style={{
            left: `${popup.x}%`,
            top: `${popup.y}%`,
          }}
        >
          <span className="mr-1">{TYPE_EMOJI[popup.type]}</span>
          {popup.text}
        </div>
      ))}
    </div>
  );
}
