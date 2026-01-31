/**
 * @fileoverview useEventSnapshots - Create tagged snapshots on significant game events
 *
 * Provides a way to create save snapshots with specific event types
 * for important game actions like portrait generation, breeding, sales, etc.
 * These snapshots help with data recovery if a save gets corrupted.
 *
 * @module hooks/useEventSnapshots
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GameState } from '@/types/game';

/** Event types that trigger snapshots */
export type SnapshotEventType =
  | 'portrait_generated'
  | 'cat_sold'
  | 'cat_adopted'
  | 'breeding_success'
  | 'purchase'
  | 'manual_save';

interface EventSnapshotOptions {
  /** Maximum number of event snapshots to keep per user */
  maxSnapshots?: number;
  /** Debounce time in ms to prevent rapid duplicate snapshots */
  debounceMs?: number;
}

interface EventSnapshotsResult {
  /** Create a tagged snapshot for a significant event */
  createEventSnapshot: (eventType: SnapshotEventType, catNames?: string[]) => Promise<void>;
  /** Whether a snapshot is currently being created */
  isCreating: boolean;
}

/**
 * Generate a simple hash for game state (for change detection)
 */
function generateStateHash(state: GameState, eventType: string): string {
  const key = `${eventType}_${state.cats.length}_${state.money}_${state.day}_${Date.now()}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Hook to create event-tagged save snapshots.
 *
 * @param userId - The authenticated user's ID
 * @param state - Current game state
 * @param options - Configuration options
 * @returns Snapshot creation function and state
 *
 * @example
 * ```typescript
 * const { createEventSnapshot } = useEventSnapshots(user?.id, state);
 *
 * // After selling a cat
 * await createEventSnapshot('cat_sold', [cat.name]);
 *
 * // After breeding success
 * await createEventSnapshot('breeding_success', [kitten.name]);
 * ```
 */
export function useEventSnapshots(
  userId: string | undefined,
  state: GameState,
  options: EventSnapshotOptions = {}
): EventSnapshotsResult {
  const { maxSnapshots = 15, debounceMs = 5000 } = options;
  const lastSnapshotTime = useRef<number>(0);
  const isCreatingRef = useRef(false);

  const createEventSnapshot = useCallback(
    async (eventType: SnapshotEventType, catNames?: string[]) => {
      if (!userId || isCreatingRef.current) return;

      // Debounce rapid snapshots
      const now = Date.now();
      if (now - lastSnapshotTime.current < debounceMs) {
        console.log('[EventSnapshots] Debounced - too soon after last snapshot');
        return;
      }

      isCreatingRef.current = true;
      lastSnapshotTime.current = now;

      try {
        console.log(`[EventSnapshots] Creating ${eventType} snapshot...`);

        // Create the snapshot
        const { error: insertError } = await supabase.from('save_snapshots').insert({
          user_id: userId,
          snapshot_type: eventType,
          cat_count: state.cats.length,
          cat_names: catNames || state.cats.map((c) => c.name),
          day: state.day,
          money: state.money,
          game_state_hash: generateStateHash(state, eventType),
        });

        if (insertError) {
          console.error('[EventSnapshots] Failed to create snapshot:', insertError);
          return;
        }

        console.log(`[EventSnapshots] Created ${eventType} snapshot successfully`);

        // Prune old snapshots (keep only the most recent ones)
        const { data: allSnapshots } = await supabase
          .from('save_snapshots')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (allSnapshots && allSnapshots.length > maxSnapshots) {
          const snapshotsToDelete = allSnapshots.slice(maxSnapshots).map((s) => s.id);
          await supabase.from('save_snapshots').delete().in('id', snapshotsToDelete);
          console.log(`[EventSnapshots] Pruned ${snapshotsToDelete.length} old snapshots`);
        }
      } catch (err) {
        console.error('[EventSnapshots] Error creating snapshot:', err);
      } finally {
        isCreatingRef.current = false;
      }
    },
    [userId, state, debounceMs, maxSnapshots]
  );

  return {
    createEventSnapshot,
    isCreating: isCreatingRef.current,
  };
}
