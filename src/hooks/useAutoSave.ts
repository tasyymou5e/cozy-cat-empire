/**
 * @fileoverview useAutoSave - Automatic cloud save with change detection
 *
 * Provides automatic periodic saving to cloud when game state changes.
 * Uses state hashing to detect changes and avoid unnecessary saves.
 *
 * @module hooks/useAutoSave
 */

import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '@/types/game';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { useCloudSave } from './useCloudSave';

interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
}

interface UseAutoSaveOptions {
  /** Interval in milliseconds between auto-save attempts (default: 5 minutes) */
  intervalMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save completes successfully */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Hook for automatic periodic cloud saves with change detection.
 *
 * Only saves when state has actually changed since the last save,
 * preventing unnecessary network requests and database writes.
 *
 * @param userId - Current user's ID (auto-save disabled if undefined)
 * @param gameState - Current game state to save
 * @param kittensBreed - Total kittens bred count
 * @param relationshipData - Cat relationship data
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useAutoSave(
 *   user?.id,
 *   state,
 *   kittensBreed,
 *   relationshipSystem,
 *   {
 *     intervalMs: 5 * 60 * 1000, // 5 minutes
 *     enabled: isLoggedIn,
 *     onSaveComplete: () => console.log('Auto-saved!'),
 *   }
 * );
 * ```
 */
export function useAutoSave(
  userId: string | undefined,
  gameState: GameState,
  kittensBreed: number,
  relationshipData: RelationshipSaveData,
  options: UseAutoSaveOptions = {}
) {
  const { intervalMs = 5 * 60 * 1000, enabled = true, onSaveComplete, onSaveError } = options;

  const { cloudSave } = useCloudSave(userId);
  const lastStateHashRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Generate a hash of the current state for change detection
  const generateStateHash = useCallback(
    (state: GameState, kittens: number): string => {
      return JSON.stringify({
        catsCount: state.cats.length,
        catIds: state.cats.map((c) => c.id).sort(),
        money: state.money,
        day: state.day,
        kittens,
        achievements: state.achievements.filter((a) => a.unlocked).length,
        resourcesHash: `${state.resources.food}-${state.resources.medicine}-${state.resources.toys}-${state.resources.treats}`,
      });
    },
    []
  );

  // Perform auto-save if state has changed
  const performAutoSave = useCallback(async () => {
    if (!userId || !enabled || isSavingRef.current) return;

    const currentHash = generateStateHash(gameState, kittensBreed);

    // Skip if nothing changed
    if (currentHash === lastStateHashRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      const success = await cloudSave(gameState, kittensBreed, relationshipData);

      if (success) {
        lastStateHashRef.current = currentHash;
        onSaveComplete?.();
      } else {
        onSaveError?.(new Error('Cloud save returned false'));
      }
    } catch (error) {
      onSaveError?.(error instanceof Error ? error : new Error('Unknown save error'));
    } finally {
      isSavingRef.current = false;
    }
  }, [
    userId,
    enabled,
    gameState,
    kittensBreed,
    relationshipData,
    cloudSave,
    generateStateHash,
    onSaveComplete,
    onSaveError,
  ]);

  // Set up auto-save interval
  useEffect(() => {
    if (!userId || !enabled) return;

    const intervalId = setInterval(performAutoSave, intervalMs);

    return () => clearInterval(intervalId);
  }, [userId, enabled, intervalMs, performAutoSave]);

  // Save on unmount (page close/navigation)
  useEffect(() => {
    if (!userId || !enabled) return;

    const handleBeforeUnload = () => {
      // Can't do async in beforeunload, but we can try
      // In practice, the regular interval saves should catch most changes
      performAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, enabled, performAutoSave]);

  return {
    /** Manually trigger a save (respects change detection) */
    saveNow: performAutoSave,
    /** Force a save regardless of change detection */
    forceSave: async () => {
      lastStateHashRef.current = ''; // Clear hash to force save
      await performAutoSave();
    },
  };
}
