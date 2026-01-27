/**
 * @fileoverview useAutoSave - Automatic cloud save with change detection
 *
 * Provides automatic periodic saving to cloud when game state changes.
 * Uses state hashing to detect changes and avoid unnecessary saves.
 * Includes retry logic and comprehensive error logging.
 *
 * @module hooks/useAutoSave
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState } from '@/types/game';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { useCloudSave } from './useCloudSave';
import { logErrorToDatabase } from './useErrorLogger';

interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
}

/** Statistics tracking for auto-save operations */
export interface AutoSaveStats {
  lastSaveTime: string | null;
  saveCount: number;
  errorCount: number;
  lastError: string | null;
  isRetrying: boolean;
}

interface UseAutoSaveOptions {
  /** Interval in milliseconds between auto-save attempts (default: 1 minute) */
  intervalMs?: number;
  /** Whether auto-save is enabled - CRITICAL: Should include hasLoadedCloud check */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes successfully */
  onSaveComplete?: () => void;
  /** Callback when save fails (after all retries) */
  onSaveError?: (error: Error, retryCount: number) => void;
}

/** Default interval: 1 minute */
const DEFAULT_INTERVAL_MS = 60 * 1000;

/** Maximum retry attempts for failed saves */
const MAX_RETRIES = 2;

/** Delay between retry attempts: 5 seconds */
const RETRY_DELAY_MS = 5000;

/**
 * Hook for automatic periodic cloud saves with change detection.
 *
 * Only saves when state has actually changed since the last save,
 * preventing unnecessary network requests and database writes.
 * Includes retry logic for failed saves and comprehensive error logging.
 *
 * @param userId - Current user's ID (auto-save disabled if undefined)
 * @param gameState - Current game state to save
 * @param kittensBreed - Total kittens bred count
 * @param relationshipData - Cat relationship data
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { stats, saveNow, forceSave } = useAutoSave(
 *   user?.id,
 *   state,
 *   kittensBreed,
 *   relationshipSystem.getRelationshipSaveData(),
 *   {
 *     intervalMs: 60 * 1000, // 1 minute
 *     enabled: isLoggedIn && hasLoadedCloud,
 *     onSaveStart: () => setCloudSyncing(true),
 *     onSaveComplete: () => {
 *       setCloudSyncing(false);
 *       setLastCloudSave(new Date().toISOString());
 *     },
 *     onSaveError: (error) => {
 *       setCloudSyncing(false);
 *       console.error('[AutoSave] Error:', error);
 *     },
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
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = true,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = options;

  const { cloudSave } = useCloudSave(userId);
  const lastStateHashRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulSaveRef = useRef<string | null>(null);

  // Track save statistics
  const [stats, setStats] = useState<AutoSaveStats>({
    lastSaveTime: null,
    saveCount: 0,
    errorCount: 0,
    lastError: null,
    isRetrying: false,
  });

  // Generate an enhanced hash of the current state for change detection
  const generateStateHash = useCallback(
    (state: GameState, kittens: number): string => {
      return JSON.stringify({
        catsCount: state.cats.length,
        catIds: state.cats.map((c) => c.id).sort(),
        catStates: state.cats.map((c) => `${c.id}:${c.health}:${c.happiness}:${c.hunger}`),
        money: state.money,
        day: state.day,
        kittens,
        achievements: state.achievements.filter((a) => a.unlocked).length,
        resourcesHash: `${state.resources.food}-${state.resources.medicine}-${state.resources.toys}-${state.resources.treats}`,
        reputation: state.reputation,
        totalShowWins: state.totalShowWins,
        ownedCostumes: state.ownedCostumes?.length || 0,
      });
    },
    []
  );

  // Log error to database with full context
  const logAutoSaveError = useCallback(
    async (error: Error, retryCount: number, stateHash: string) => {
      try {
        await logErrorToDatabase({
          error_type: 'auto_save_error',
          error_message: `Auto-save failed after ${retryCount} retries: ${error.message}`,
          user_id: userId,
          metadata: {
            retryCount,
            stateHash: stateHash.slice(0, 100), // Truncate for storage
            catsCount: gameState.cats.length,
            day: gameState.day,
            intervalMs,
            lastSuccessfulSave: lastSuccessfulSaveRef.current,
          },
        });
      } catch (logError) {
        console.error('[AutoSave] Failed to log error:', logError);
      }
    },
    [userId, gameState.cats.length, gameState.day, intervalMs]
  );

  // Perform auto-save with retry logic
  const performAutoSaveWithRetry = useCallback(
    async (retryCount = 0, currentHash?: string) => {
      if (!userId || !enabled || isSavingRef.current) {
        if (!enabled && userId) {
          console.log('[AutoSave] Skipped: auto-save disabled (cloud not loaded or user logged out)');
        }
        return;
      }

      const hash = currentHash ?? generateStateHash(gameState, kittensBreed);

      // Skip if nothing changed (only on first attempt)
      if (retryCount === 0 && hash === lastStateHashRef.current) {
        console.log('[AutoSave] Skipped: no changes detected');
        return;
      }

      // Mark as saving
      if (retryCount === 0) {
        isSavingRef.current = true;
        onSaveStart?.();
        console.log('[AutoSave] Starting save...');
      } else {
        setStats((prev) => ({ ...prev, isRetrying: true }));
        console.log(`[AutoSave] Retry attempt ${retryCount}/${MAX_RETRIES}...`);
      }

      try {
        const result = await cloudSave(gameState, kittensBreed, relationshipData);

        if (result.success) {
          // Success!
          lastStateHashRef.current = hash;
          lastSuccessfulSaveRef.current = new Date().toISOString();
          
          setStats((prev) => ({
            ...prev,
            lastSaveTime: lastSuccessfulSaveRef.current,
            saveCount: prev.saveCount + 1,
            isRetrying: false,
          }));

          console.log('[AutoSave] Save successful');
          onSaveComplete?.();
        } else {
          // Save returned failure
          const error = new Error(result.error || 'Cloud save returned false');
          
          if (retryCount < MAX_RETRIES) {
            console.warn(`[AutoSave] Save failed, retrying in ${RETRY_DELAY_MS}ms...`, error.message);
            retryTimeoutRef.current = setTimeout(
              () => performAutoSaveWithRetry(retryCount + 1, hash),
              RETRY_DELAY_MS
            );
          } else {
            // Max retries exceeded
            await logAutoSaveError(error, retryCount, hash);
            setStats((prev) => ({
              ...prev,
              errorCount: prev.errorCount + 1,
              lastError: error.message,
              isRetrying: false,
            }));
            onSaveError?.(error, retryCount);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown save error');

        if (retryCount < MAX_RETRIES) {
          console.warn(`[AutoSave] Save threw error, retrying in ${RETRY_DELAY_MS}ms...`, err.message);
          retryTimeoutRef.current = setTimeout(
            () => performAutoSaveWithRetry(retryCount + 1, hash),
            RETRY_DELAY_MS
          );
        } else {
          // Max retries exceeded
          await logAutoSaveError(err, retryCount, hash);
          setStats((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
            lastError: err.message,
            isRetrying: false,
          }));
          onSaveError?.(err, retryCount);
        }
      } finally {
        if (retryCount === 0 || retryCount >= MAX_RETRIES) {
          isSavingRef.current = false;
        }
      }
    },
    [
      userId,
      enabled,
      gameState,
      kittensBreed,
      relationshipData,
      cloudSave,
      generateStateHash,
      logAutoSaveError,
      onSaveStart,
      onSaveComplete,
      onSaveError,
    ]
  );

  // Set up auto-save interval
  useEffect(() => {
    if (!userId || !enabled) return;

    console.log(`[AutoSave] Starting auto-save interval: ${intervalMs}ms`);
    const intervalId = setInterval(performAutoSaveWithRetry, intervalMs);

    return () => {
      console.log('[AutoSave] Clearing auto-save interval');
      clearInterval(intervalId);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [userId, enabled, intervalMs, performAutoSaveWithRetry]);

  // Save on unmount (page close/navigation)
  useEffect(() => {
    if (!userId || !enabled) return;

    const handleBeforeUnload = () => {
      // Can't do async in beforeunload, but we can try
      // In practice, the regular interval saves should catch most changes
      console.log('[AutoSave] beforeunload - attempting final save');
      performAutoSaveWithRetry();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, enabled, performAutoSaveWithRetry]);

  return {
    /** Current auto-save statistics */
    stats,
    /** Manually trigger a save (respects change detection) */
    saveNow: performAutoSaveWithRetry,
    /** Force a save regardless of change detection */
    forceSave: async () => {
      lastStateHashRef.current = ''; // Clear hash to force save
      await performAutoSaveWithRetry();
    },
  };
}
