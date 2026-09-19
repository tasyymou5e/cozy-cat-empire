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
import { logErrorToDatabase } from './useErrorLogger';
import { createLogger } from '@/lib/logger';

const log = createLogger('AutoSave');

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
  intervalMs?: number;
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error, retryCount: number) => void;
}

const DEFAULT_INTERVAL_MS = 60 * 1000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

/**
 * Hook for automatic periodic cloud saves with change detection.
 *
 * @example
 * ```tsx
 * const { stats, saveNow, forceSave } = useAutoSave(
 *   user?.id, state, kittensBreed,
 *   relationshipSystem.getRelationshipSaveData(),
 *   { intervalMs: 60_000, enabled: isLoggedIn && hasLoadedCloud }
 * );
 * ```
 */
type CloudSaveFn = (
  gameState: GameState,
  kittensBreed: number,
  relationshipData: RelationshipSaveData,
  options?: { isNewUser?: boolean }
) => Promise<{ success: boolean; error?: string }>;

export function useAutoSave(
  userId: string | undefined,
  gameState: GameState,
  kittensBreed: number,
  relationshipData: RelationshipSaveData,
  cloudSaveFn: CloudSaveFn,
  options: UseAutoSaveOptions = {}
) {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = true,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = options;

  const lastStateHashRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulSaveRef = useRef<string | null>(null);

  /**
   * Latest render values kept in a ref so the save callback (and therefore the
   * 60s interval) has a stable identity. Without this, every game-state change
   * recreated the interval and continuous play could starve auto-save forever.
   */
  const latestRef = useRef({
    gameState,
    kittensBreed,
    relationshipData,
    cloudSave: cloudSaveFn,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  });
  latestRef.current = {
    gameState,
    kittensBreed,
    relationshipData,
    cloudSave: cloudSaveFn,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  };

  const [stats, setStats] = useState<AutoSaveStats>({
    lastSaveTime: null,
    saveCount: 0,
    errorCount: 0,
    lastError: null,
    isRetrying: false,
  });

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

  const logAutoSaveError = useCallback(
    async (error: Error, retryCount: number, stateHash: string) => {
      const { gameState: gs } = latestRef.current;
      try {
        await logErrorToDatabase({
          error_type: 'auto_save_error',
          error_message: `Auto-save failed after ${retryCount} retries: ${error.message}`,
          user_id: userId,
          metadata: {
            retryCount,
            stateHash: stateHash.slice(0, 100),
            catsCount: gs.cats.length,
            day: gs.day,
            intervalMs,
            lastSuccessfulSave: lastSuccessfulSaveRef.current,
          },
        });
      } catch (logError) {
        log.error('Failed to log error:', logError);
      }
    },
    [userId, intervalMs]
  );

  const performAutoSaveWithRetry = useCallback(
    async (retryCount = 0, currentHash?: string) => {
      if (!userId || !enabled || isSavingRef.current) {
        if (!enabled && userId) {
          log.debug('Skipped: auto-save disabled (cloud not loaded or user logged out)');
        }
        return;
      }

      const {
        gameState: gs,
        kittensBreed: kb,
        relationshipData: rd,
        cloudSave,
        onSaveStart: startCb,
        onSaveComplete: completeCb,
        onSaveError: errorCb,
      } = latestRef.current;

      const hash = currentHash ?? generateStateHash(gs, kb);

      if (retryCount === 0 && hash === lastStateHashRef.current) {
        log.debug('Skipped: no changes detected');
        return;
      }

      if (retryCount === 0) {
        isSavingRef.current = true;
        startCb?.();
        log.debug('Starting save...');
      } else {
        setStats((prev) => ({ ...prev, isRetrying: true }));
        log.debug(`Retry attempt ${retryCount}/${MAX_RETRIES}...`);
      }

      try {
        const result = await cloudSave(gs, kb, rd);

        if (result.success) {
          lastStateHashRef.current = hash;
          lastSuccessfulSaveRef.current = new Date().toISOString();
          
          setStats((prev) => ({
            ...prev,
            lastSaveTime: lastSuccessfulSaveRef.current,
            saveCount: prev.saveCount + 1,
            isRetrying: false,
          }));

          log.debug('Save successful');
          completeCb?.();
        } else {
          const error = new Error(result.error || 'Cloud save returned false');
          
          if (retryCount < MAX_RETRIES) {
            log.warn(`Save failed, retrying in ${RETRY_DELAY_MS}ms...`, error.message);
            retryTimeoutRef.current = setTimeout(
              () => performAutoSaveWithRetry(retryCount + 1, hash),
              RETRY_DELAY_MS
            );
          } else {
            await logAutoSaveError(error, retryCount, hash);
            setStats((prev) => ({
              ...prev,
              errorCount: prev.errorCount + 1,
              lastError: error.message,
              isRetrying: false,
            }));
            errorCb?.(error, retryCount);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown save error');

        if (retryCount < MAX_RETRIES) {
          log.warn(`Save threw error, retrying in ${RETRY_DELAY_MS}ms...`, err.message);
          retryTimeoutRef.current = setTimeout(
            () => performAutoSaveWithRetry(retryCount + 1, hash),
            RETRY_DELAY_MS
          );
        } else {
          await logAutoSaveError(err, retryCount, hash);
          setStats((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
            lastError: err.message,
            isRetrying: false,
          }));
          errorCb?.(err, retryCount);
        }
      } finally {
        if (retryCount === 0 || retryCount >= MAX_RETRIES) {
          isSavingRef.current = false;
        }
      }
    },
    [userId, enabled, generateStateHash, logAutoSaveError]
  );

  useEffect(() => {
    if (!userId || !enabled) return;

    log.debug(`Starting auto-save interval: ${intervalMs}ms`);
    const intervalId = setInterval(performAutoSaveWithRetry, intervalMs);

    return () => {
      log.debug('Clearing auto-save interval');
      clearInterval(intervalId);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [userId, enabled, intervalMs, performAutoSaveWithRetry]);

  /**
   * Last-chance saves. `beforeunload` is unreliable (it never fires on mobile
   * tab kills and async work is cancelled), so we:
   *  - save normally when the tab is merely hidden (page is still alive), and
   *  - dispatch a `keepalive` request on `pagehide`, which the browser finishes
   *    even after the tab is gone.
   */
  useEffect(() => {
    if (!userId || !enabled) return;

    startTokenCache();

    const flushWithKeepalive = (reason: string) => {
      const { gameState: gs, kittensBreed: kb, relationshipData: rd } = latestRef.current;
      const hash = generateStateHash(gs, kb);
      if (hash === lastStateHashRef.current) {
        log.debug(`${reason} - nothing to save`);
        return;
      }

      const dispatched = keepaliveCloudSave({
        userId,
        gameState: gs,
        kittensBreed: kb,
        relationships: rd,
      });

      if (dispatched) {
        lastStateHashRef.current = hash;
        lastSuccessfulSaveRef.current = new Date().toISOString();
        log.debug(`${reason} - keepalive save dispatched`);
      } else {
        log.debug(`${reason} - keepalive unavailable, falling back to async save`);
        performAutoSaveWithRetry();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is still running here, so a normal (retryable) save is best.
        performAutoSaveWithRetry();
      }
    };

    const handlePageHide = () => flushWithKeepalive('pagehide');
    const handleBeforeUnload = () => flushWithKeepalive('beforeunload');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, enabled, performAutoSaveWithRetry, generateStateHash]);

  return {
    stats,
    saveNow: performAutoSaveWithRetry,
    forceSave: async () => {
      lastStateHashRef.current = '';
      await performAutoSaveWithRetry();
    },
  };
}