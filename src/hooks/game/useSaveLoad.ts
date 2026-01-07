/**
 * @fileoverview useSaveLoad - Game persistence domain hook
 *
 * Handles saving and loading game state to/from localStorage and cloud.
 * Provides functionality for:
 * - Local save/load operations
 * - Cloud save integration
 * - Game reset
 * - Save existence checks
 *
 * @module hooks/game/useSaveLoad
 */

import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { isValidGameState } from '@/types/guards';
import { GameHookDependencies, SAVE_KEY, createInitialState, RelationshipSaveData } from './types';

/**
 * Actions available for save/load operations
 */
export interface SaveLoadActions {
  /**
   * Save current game state to localStorage.
   * Includes game state, kittens bred, and relationships.
   */
  saveGame: () => void;

  /**
   * Load game state from localStorage.
   * Restores game state, kittens bred, and relationships.
   */
  loadGame: () => void;

  /**
   * Check if a saved game exists in localStorage
   * @returns true if a save exists
   */
  hasSaveGame: () => boolean;

  /**
   * Get the day number from the saved game
   * @returns Day number or null if no save exists
   */
  getSaveDay: () => number | null;

  /**
   * Reset game to initial state and clear localStorage save
   */
  resetGame: () => void;

  /**
   * Load game from cloud save data.
   * Used by useCloudSave hook for cloud sync.
   * @param gameState - Game state to restore
   * @param kittens - Kittens bred count
   * @param relationshipData - Optional relationship data
   */
  loadFromData: (
    gameState: GameState,
    kittens: number,
    relationshipData: RelationshipSaveData | null
  ) => void;
}

/**
 * Hook for managing game saves.
 *
 * @param deps - Shared game hook dependencies
 * @returns Object containing all save/load actions
 *
 * @example
 * ```typescript
 * const { saveGame, loadGame, hasSaveGame, resetGame } = useSaveLoad(deps);
 *
 * // Check for existing save
 * if (hasSaveGame()) {
 *   loadGame(); // Resume previous game
 * }
 *
 * // Save progress
 * saveGame();
 *
 * // Start fresh
 * resetGame();
 * ```
 */
export function useSaveLoad(deps: GameHookDependencies): SaveLoadActions {
  const {
    state,
    setState,
    showMessage,
    playSound,
    relationshipSystem,
    kittensBreed,
    setKittensBreed,
  } = deps;

  const saveGame = useCallback(() => {
    const saveData = {
      state,
      kittensBreed,
      relationships: relationshipSystem.getRelationshipSaveData(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    showMessage('Game saved! 💾', 'success');
    playSound?.('success');
  }, [state, kittensBreed, relationshipSystem, playSound, showMessage]);

  const loadGame = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      showMessage('No saved game found!', 'warning');
      return;
    }
    try {
      const data = JSON.parse(saved) as unknown;

      // Validate parsed data structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid save format');
      }

      const saveData = data as Record<string, unknown>;

      // Validate game state using type guard
      if (!isValidGameState(saveData.state)) {
        console.error('Local save: Invalid game state structure');
        showMessage('Save data is corrupted. Starting new game.', 'error');
        localStorage.removeItem(SAVE_KEY);
        return;
      }

      setState(saveData.state);

      if (typeof saveData.kittensBreed === 'number') {
        setKittensBreed(saveData.kittensBreed);
      }

      if (saveData.relationships && typeof saveData.relationships === 'object') {
        relationshipSystem.loadRelationships(saveData.relationships as RelationshipSaveData);
        relationshipSystem.detectGroups(saveData.state.cats);
      }

      showMessage(`Welcome back! Day ${saveData.state.day}. 🎮`, 'success');
      playSound?.('success');
    } catch (e) {
      console.error('Load game error:', e);
      showMessage('Error loading save!', 'error');
    }
  }, [setState, setKittensBreed, relationshipSystem, playSound, showMessage]);

  const hasSaveGame = useCallback(() => {
    return localStorage.getItem(SAVE_KEY) !== null;
  }, []);

  const getSaveDay = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    try {
      const data = JSON.parse(saved) as unknown;
      if (typeof data === 'object' && data !== null) {
        const saveData = data as Record<string, unknown>;
        if (isValidGameState(saveData.state)) {
          return saveData.state.day;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setState(createInitialState());
    setKittensBreed(0);
    relationshipSystem.loadRelationships({
      relationships: [],
      events: [],
      maintenanceStreak: 0,
      longestMaintenanceStreak: 0,
      lastMaintenanceDay: null,
    });
    showMessage('New game started! Good luck! 🎉', 'success');
    playSound?.('success');
  }, [setState, setKittensBreed, relationshipSystem, playSound, showMessage]);

  const loadFromData = useCallback(
    (gameState: GameState, kittens: number, relationshipData: RelationshipSaveData | null) => {
      setState(gameState);
      setKittensBreed(kittens);
      if (relationshipData) {
        relationshipSystem.loadRelationships(relationshipData);
        relationshipSystem.detectGroups(gameState.cats);
      }
      showMessage(`Cloud save loaded! Day ${gameState.day}. ☁️`, 'success');
      playSound?.('success');
    },
    [setState, setKittensBreed, relationshipSystem, playSound, showMessage]
  );

  return {
    saveGame,
    loadGame,
    hasSaveGame,
    getSaveDay,
    resetGame,
    loadFromData,
  };
}
