/**
 * @fileoverview Consolidated event handlers for CatFarm component
 *
 * Extracts all callback functions from CatFarm.tsx into a dedicated hook
 * to improve code organization and reduce the main component's complexity.
 *
 * @module hooks/useCatFarmHandlers
 */

import { useCallback, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameEvents } from '@/hooks/useGameEvents';
import { ObjectiveType } from '@/types/dailyObjectives';
import { CURRENT_VERSION } from '@/types/changelog';
import { MOOD_LABELS } from '@/constants/moods';
import {
  useRewardHandlers,
  useCloudHandlers,
  useAudioHandlers,
  useSocialHandlers,
} from './handlers';
import type { CatFarmState } from './useCatFarmState';

// Re-export for backward compatibility
export { MOOD_LABELS } from '@/constants/moods';

/**
 * Dependencies required by useCatFarmHandlers
 */
interface HandlerDependencies {
  farmState: CatFarmState;
}

/**
 * Consolidated handlers hook for CatFarm component
 *
 * @param deps - Dependencies from useCatFarmState
 * @returns All event handlers needed by CatFarm
 *
 * @example
 * ```tsx
 * const farmState = useCatFarmState();
 * const handlers = useCatFarmHandlers({ farmState });
 * ```
 */
export function useCatFarmHandlers({ farmState }: HandlerDependencies) {
  const { state, actions, objectives, battlePass, coopChallenges, ui } = farmState;

  // Extracted handler hooks
  const rewardHandlers = useRewardHandlers({ farmState });
  const cloudHandlers = useCloudHandlers({ farmState });
  const audioHandlers = useAudioHandlers({ farmState });
  const socialHandlers = useSocialHandlers({ farmState });

  // Wrapper for actions that update objectives
  const trackObjective = useCallback(
    (type: ObjectiveType, amount: number = 1) => {
      objectives.updateProgress(type, amount);
    },
    [objectives]
  );

  // Centralized game event dispatcher
  const { dispatchAction } = useGameEvents({
    actions,
    trackObjective,
    addBattlePassXP: battlePass.addXP,
    updateCoopProgress: coopChallenges.updateProgress,
  });

  // Keyboard shortcuts
  const handleFeed = useCallback(() => {
    if (state.resources.food > 0 && state.cats.length > 0) {
      actions.feedCats();
    }
  }, [state.resources.food, state.cats.length, actions]);

  useKeyboardShortcuts({
    onFeed: handleFeed,
    onNextDay: actions.nextDay,
    onSave: actions.saveGame,
    onTabChange: ui.setSideTab,
  });

  // Listen for ? key to show shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement)) {
        ui.setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [ui]);

  // Check for What's New popup on mount
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('cat-farm-last-seen-version');
    const tutorialComplete = localStorage.getItem('cat-farm-tutorial-complete');

    if (tutorialComplete && lastSeenVersion !== CURRENT_VERSION) {
      const timer = setTimeout(() => ui.setShowWhatsNew(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [ui]);

  return {
    // Reward handlers
    ...rewardHandlers,

    // Cloud handlers
    ...cloudHandlers,

    // Audio handlers
    ...audioHandlers,

    // Social handlers
    ...socialHandlers,

    // Game event dispatcher
    dispatchAction,
  };
}

export type CatFarmHandlers = ReturnType<typeof useCatFarmHandlers>;
