import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { GameHookDependencies, SAVE_KEY, createInitialState, RelationshipSaveData } from './types';

export interface SaveLoadActions {
  saveGame: () => void;
  loadGame: () => void;
  hasSaveGame: () => boolean;
  getSaveDay: () => number | null;
  resetGame: () => void;
  loadFromData: (gameState: GameState, kittens: number, relationshipData: RelationshipSaveData | null) => void;
}

export function useSaveLoad(deps: GameHookDependencies): SaveLoadActions {
  const { 
    state, 
    setState, 
    showMessage, 
    playSound, 
    relationshipSystem, 
    kittensBreed, 
    setKittensBreed 
  } = deps;

  const saveGame = useCallback(() => {
    const saveData = { 
      state, 
      kittensBreed, 
      relationships: relationshipSystem.getRelationshipSaveData(), 
      savedAt: new Date().toISOString() 
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
      const data = JSON.parse(saved);
      setState(data.state);
      if (data.kittensBreed !== undefined) {
        setKittensBreed(data.kittensBreed);
      }
      if (data.relationships) {
        relationshipSystem.loadRelationships(data.relationships);
        relationshipSystem.detectGroups(data.state.cats);
      }
      showMessage(`Welcome back! Day ${data.state.day}. 🎮`, 'success');
      playSound?.('success');
    } catch (e) {
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
      return JSON.parse(saved).state.day;
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

  const loadFromData = useCallback((
    gameState: GameState, 
    kittens: number, 
    relationshipData: RelationshipSaveData | null
  ) => {
    setState(gameState);
    setKittensBreed(kittens);
    if (relationshipData) {
      relationshipSystem.loadRelationships(relationshipData);
      relationshipSystem.detectGroups(gameState.cats);
    }
    showMessage(`Cloud save loaded! Day ${gameState.day}. ☁️`, 'success');
    playSound?.('success');
  }, [setState, setKittensBreed, relationshipSystem, playSound, showMessage]);

  return { 
    saveGame, 
    loadGame, 
    hasSaveGame, 
    getSaveDay, 
    resetGame, 
    loadFromData 
  };
}
