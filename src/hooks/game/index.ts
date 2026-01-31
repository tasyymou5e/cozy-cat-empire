/**
 * @fileoverview useGameState - Modular Game State Management
 *
 * This is the central game state hook that composes all domain-specific hooks
 * into a unified API. It provides a single entry point for all game logic
 * and state management.
 *
 * ## Architecture
 *
 * The hook is composed of 9 focused domain hooks:
 * - {@link useSaveLoad} - Game persistence (local & cloud)
 * - {@link useCostumes} - Costume purchasing and equipping
 * - {@link useResources} - Resource management (food, medicine, etc.)
 * - {@link useCatManagement} - Cat lifecycle operations
 * - {@link useTraining} - Training and socialization
 * - {@link useBreeding} - Cat breeding
 * - {@link useBulkActions} - Mass operations on cats
 * - {@link useCatShows} - Show competitions
 * - {@link useGameCore} - Core mechanics (chores, housing, day cycle)
 *
 * ## Usage
 *
 * ```typescript
 * const {
 *   state,           // Current game state
 *   message,         // Current message text
 *   messageType,     // Message type (info/success/warning/error)
 *   kittensBreed,    // Total kittens bred
 *   relationshipSystem, // Cat relationships manager
 *   currentDailyEvent,  // Active daily event
 *   actions,         // All game actions (44 total)
 * } = useGameState(playSound, onChallengeProgress, logActivity);
 * ```
 *
 * @module hooks/game
 */

import { useState, useCallback, useMemo } from 'react';
import { GameState, ACHIEVEMENT_DEFS } from '@/types/game';
import { DailyEvent } from '@/types/dailyEvents';
import { useRelationships } from '../useRelationships';
import { SoundType } from '@/contexts/SoundContext';
import { ChallengeType } from '@/types/challenges';
import { LogActivityParams } from '../usePlayerActivityLog';

// Domain hooks
import { useSaveLoad } from './useSaveLoad';
import { useCostumes } from './useCostumes';
import { useResources } from './useResources';
import { useCatManagement } from './useCatManagement';
import { useTraining } from './useTraining';
import { useBreeding } from './useBreeding';
import { useBulkActions } from './useBulkActions';
import { useCatShows } from './useCatShows';
import { useGameCore } from './useGameCore';

// Types and utilities
import {
  GameHookDependencies,
  GameActions,
  createInitialState,
  RelationshipSaveData,
} from './types';

// Re-export types for consumers
export type { GameActions, GameHookDependencies, RelationshipSaveData };
export { createInitialState };

/**
 * Core game logic and state management hook.
 *
 * This is the main entry point for game state. It combines all domain hooks
 * into a single unified interface with 44 game actions across 9 domains.
 *
 * @param playSound - Optional sound effect callback
 * @param onChallengeProgress - Optional challenge progress callback
 * @param logActivity - Optional activity logging callback
 *
 * @returns Game state, messages, and all game actions
 *
 * @example
 * ```typescript
 * function CatFarm() {
 *   const { playSound } = useSound(); // from SoundContext
 *   const { onChallengeProgress } = useWeeklyChallenges();
 *
 *   const {
 *     state,
 *     message,
 *     messageType,
 *     actions
 *   } = useGameState(playSound, onChallengeProgress);
 *
 *   return (
 *     <div>
 *       <StatusBar money={state.money} day={state.day} />
 *       <button onClick={() => actions.addCat('stray')}>
 *         Add Stray Cat
 *       </button>
 *       <button onClick={() => actions.nextDay()}>
 *         Next Day
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGameState(
  playSound?: (type: SoundType) => void,
  onChallengeProgress?: (type: ChallengeType, increment?: number) => void,
  logActivity?: (params: LogActivityParams) => void
) {
  // Core state
  const [state, setState] = useState<GameState>(createInitialState);
  const [message, setMessage] = useState<string>(
    'Welcome to Cat Farm! Start your feline empire! 🐱'
  );
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [kittensBreed, setKittensBreed] = useState(0);
  const [currentDailyEvent, setCurrentDailyEvent] = useState<DailyEvent | null>(null);

  // Relationship system
  const relationshipSystem = useRelationships();

  /**
   * Display a message to the user
   * @param msg - Message text
   * @param type - Message type for styling
   */
  const showMessage = useCallback(
    (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      setMessage(msg);
      setMessageType(type);
    },
    []
  );

  /**
   * Check and unlock achievements based on current game state
   * @param newState - Updated game state to check
   * @param extraKittens - Additional kittens to count
   * @param wasBestFriendBreed - Whether breeding involved best friends
   * @returns Updated state with any newly unlocked achievements
   */
  const checkAchievements = useCallback(
    (newState: GameState, extraKittens = 0, wasBestFriendBreed = false): GameState => {
      const stats = {
        cats: newState.cats.length,
        showWins: newState.totalShowWins,
        money: newState.totalMoneyEarned,
        house:
          newState.houseSize === 'house' ||
          newState.houseSize === 'mansion' ||
          newState.houseSize === 'farm',
        farm: newState.houseSize === 'farm',
        acres: newState.acres,
        bestFriendBreed: wasBestFriendBreed,
      };

      const newUnlocks: string[] = [];
      const updatedAchievements = newState.achievements.map((a) => {
        if (a.unlocked) return a;

        let achieved = false;
        switch (a.id) {
          case 'first_cat':
            achieved = stats.cats >= a.target;
            break;
          case 'cat_collector':
          case 'cat_empire':
            achieved = stats.cats >= a.target;
            break;
          case 'show_winner':
          case 'champion':
            achieved = stats.showWins >= a.target;
            break;
          case 'millionaire':
            achieved = stats.money >= a.target;
            break;
          case 'breeder':
          case 'master_breeder':
            achieved = kittensBreed + extraKittens >= a.target;
            break;
          case 'homeowner':
            achieved = stats.house;
            break;
          case 'farmer':
            achieved = stats.farm;
            break;
          case 'land_baron':
            achieved = stats.acres >= a.target;
            break;
          case 'perfect_match':
            achieved = stats.bestFriendBreed;
            break;
          case 'tutorial_graduate': {
            // Check localStorage for tutorial completion
            const tutorialRewardClaimed = typeof window !== 'undefined' 
              ? localStorage.getItem('cat-farm-tutorial-reward-claimed') === 'true'
              : false;
            achieved = tutorialRewardClaimed;
            break;
          }
        }

        if (achieved) {
          newUnlocks.push(a.name);
          return { ...a, unlocked: true, unlockedAt: newState.day };
        }
        return a;
      });

      if (newUnlocks.length > 0) {
        setTimeout(() => {
          showMessage(`🏆 Achievement unlocked: ${newUnlocks.join(', ')}!`, 'success');
          playSound?.('achievement');
        }, 100);
      }

      return { ...newState, achievements: updatedAchievements };
    },
    [kittensBreed, playSound, showMessage]
  );

  // Build shared dependencies for domain hooks
  const deps: GameHookDependencies = useMemo(
    () => ({
      state,
      setState,
      showMessage,
      playSound,
      onChallengeProgress,
      logActivity,
      relationshipSystem,
      kittensBreed,
      setKittensBreed,
      checkAchievements,
    }),
    [
      state,
      showMessage,
      playSound,
      onChallengeProgress,
      logActivity,
      relationshipSystem,
      kittensBreed,
      checkAchievements,
    ]
  );

  // Compose domain hooks
  const saveLoadActions = useSaveLoad(deps);
  const costumeActions = useCostumes(deps);
  const resourceActions = useResources(deps);
  const catManagementActions = useCatManagement(deps);
  const trainingActions = useTraining(deps);
  const breedingActions = useBreeding(deps);
  const bulkActions = useBulkActions(deps);
  const catShowActions = useCatShows(deps);
  const gameCoreActions = useGameCore({
    ...deps,
    setCurrentDailyEvent,
    setMessage,
  });

  // Merge all actions into unified interface
  const actions: GameActions = useMemo(
    () => ({
      // Cat Management (10)
      addCat: catManagementActions.addCat,
      buyFromMarket: catManagementActions.buyFromMarket,
      sellCat: catManagementActions.sellCat,
      renameCat: catManagementActions.renameCat,
      comfortCat: catManagementActions.comfortCat,
      addReceivedCat: catManagementActions.addReceivedCat,
      updateCatAppearance: catManagementActions.updateCatAppearance,
      updateCatPortrait: catManagementActions.updateCatPortrait,
      setSpecialization: catManagementActions.setSpecialization,
      addSpecializationXP: catManagementActions.addSpecializationXP,

      // Resources (6)
      buyResource: resourceActions.buyResource,
      feedCats: resourceActions.feedCats,
      feedSingleCat: resourceActions.feedSingleCat,
      useToys: resourceActions.useToys,
      useMedicine: resourceActions.useMedicine,
      addReward: resourceActions.addReward,

      // Training (4)
      trainCat: trainingActions.trainCat,
      restCat: trainingActions.restCat,
      doGroupActivity: trainingActions.doGroupActivity,
      socializeCats: trainingActions.socializeCats,

      // Shows (1)
      catShow: catShowActions.catShow,

      // Breeding (1)
      breedCats: breedingActions.breedCats,

      // Bulk Actions (6)
      healAllSickCats: bulkActions.healAllSickCats,
      restAllTiredCats: bulkActions.restAllTiredCats,
      comfortAllUnhappyCats: bulkActions.comfortAllUnhappyCats,
      trainAllAvailableCats: bulkActions.trainAllAvailableCats,
      sellSelectedCats: bulkActions.sellSelectedCats,
      socializeAllNeglected: bulkActions.socializeAllNeglected,

      // Save/Load (6)
      saveGame: saveLoadActions.saveGame,
      loadGame: saveLoadActions.loadGame,
      hasSaveGame: saveLoadActions.hasSaveGame,
      getSaveDay: saveLoadActions.getSaveDay,
      resetGame: saveLoadActions.resetGame,
      loadFromData: saveLoadActions.loadFromData,

      // Costumes (2)
      buyCostume: costumeActions.buyCostume,
      equipCostume: costumeActions.equipCostume,

      // Core/Daily (9)
      doChore: gameCoreActions.doChore,
      upgradeHouse: gameCoreActions.upgradeHouse,
      nextDay: gameCoreActions.nextDay,
      processDailyEvent: gameCoreActions.processDailyEvent,
      clearDailyEvent: gameCoreActions.clearDailyEvent,
      dismissMessage: gameCoreActions.dismissMessage,
      deductMoney: gameCoreActions.deductMoney,
      setMoney: gameCoreActions.setMoney,
      setEmpireRenderUrl: gameCoreActions.setEmpireRenderUrl,
    }),
    [
      catManagementActions,
      resourceActions,
      trainingActions,
      catShowActions,
      breedingActions,
      bulkActions,
      saveLoadActions,
      costumeActions,
      gameCoreActions,
    ]
  );

  return {
    state,
    message,
    messageType,
    kittensBreed,
    relationshipSystem,
    currentDailyEvent,
    actions,
  };
}
