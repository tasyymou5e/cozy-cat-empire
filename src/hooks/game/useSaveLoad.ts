/**
 * @fileoverview useSaveLoad - Game persistence domain hook
 *
 * @module hooks/game/useSaveLoad
 */

import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { isValidGameState } from '@/types/guards';
import { migrateSaveData, needsMigration, getSaveVersionInfo } from '@/lib/saveMigration';
import { GameHookDependencies, SAVE_KEY, createInitialState, RelationshipSaveData } from './types';
import { createLogger } from '@/lib/logger';

const log = createLogger('SaveLoad');

export interface SaveLoadActions {
  saveGame: () => void;
  loadGame: () => void;
  hasSaveGame: () => boolean;
  getSaveDay: () => number | null;
  resetGame: () => void;
  loadFromData: (gameState: GameState, kittens: number, relationshipData: RelationshipSaveData | null) => void;
}

export function useSaveLoad(deps: GameHookDependencies): SaveLoadActions {
  const { state, setState, showMessage, playSound, relationshipSystem, kittensBreed, setKittensBreed } = deps;

  const saveGame = useCallback(() => {
    const saveData = {
      state, kittensBreed,
      relationships: relationshipSystem.getRelationshipSaveData(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    showMessage('Game saved! 💾', 'success');
    playSound?.('success');
  }, [state, kittensBreed, relationshipSystem, playSound, showMessage]);

  const loadGame = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) { showMessage('No saved game found!', 'warning'); return; }
    try {
      const data = JSON.parse(saved) as unknown;
      if (typeof data !== 'object' || data === null) throw new Error('Invalid save format');

      let saveData = data as Record<string, unknown>;

      if (needsMigration(saveData)) {
        const versionInfo = getSaveVersionInfo(saveData);
        log.info(`Migrating save from v${versionInfo.currentVersion} to v${versionInfo.targetVersion}`);
        const migrationResult = migrateSaveData(saveData);
        if (!migrationResult.success) {
          const errorResult = migrationResult as { success: false; error: string };
          log.error('Migration failed:', errorResult.error);
          showMessage('Save data could not be migrated. Starting new game.', 'error');
          localStorage.removeItem(SAVE_KEY);
          return;
        }
        if (migrationResult.warnings.length > 0) {
          log.warn('Migration warnings:', migrationResult.warnings);
        }
        saveData = migrationResult.data as unknown as Record<string, unknown>;
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        log.info('Save migrated and updated in localStorage');
      }

      if (!isValidGameState(saveData.state)) {
        log.error('Local save: Invalid game state structure after migration');
        showMessage('Save data is corrupted. Starting new game.', 'error');
        localStorage.removeItem(SAVE_KEY);
        return;
      }

      setState(saveData.state);
      if (typeof saveData.kittensBreed === 'number') setKittensBreed(saveData.kittensBreed);
      if (saveData.relationships && typeof saveData.relationships === 'object') {
        relationshipSystem.loadRelationships(saveData.relationships as RelationshipSaveData);
        relationshipSystem.detectGroups(saveData.state.cats);
      }
      showMessage(`Welcome back! Day ${saveData.state.day}. 🎮`, 'success');
      playSound?.('success');
    } catch (e) {
      log.error('Load game error:', e);
      showMessage('Error loading save!', 'error');
    }
  }, [setState, setKittensBreed, relationshipSystem, playSound, showMessage]);

  const hasSaveGame = useCallback(() => localStorage.getItem(SAVE_KEY) !== null, []);

  const getSaveDay = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    try {
      const data = JSON.parse(saved) as unknown;
      if (typeof data === 'object' && data !== null) {
        const saveData = data as Record<string, unknown>;
        if (isValidGameState(saveData.state)) return saveData.state.day;
      }
      return null;
    } catch { return null; }
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setState(createInitialState());
    setKittensBreed(0);
    relationshipSystem.loadRelationships({ relationships: [], events: [], maintenanceStreak: 0, longestMaintenanceStreak: 0, lastMaintenanceDay: null });
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

  return { saveGame, loadGame, hasSaveGame, getSaveDay, resetGame, loadFromData };
}