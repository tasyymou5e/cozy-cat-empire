/**
 * @fileoverview useEventSnapshots - Create tagged snapshots on significant game events
 *
 * @module hooks/useEventSnapshots
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GameState } from '@/types/game';
import { createLogger } from '@/lib/logger';

const log = createLogger('EventSnapshots');

export type SnapshotEventType =
  | 'portrait_generated'
  | 'cat_sold'
  | 'cat_adopted'
  | 'breeding_success'
  | 'purchase'
  | 'manual_save';

interface EventSnapshotOptions {
  maxSnapshots?: number;
  debounceMs?: number;
}

interface EventSnapshotsResult {
  createEventSnapshot: (eventType: SnapshotEventType, catNames?: string[]) => Promise<void>;
  isCreating: boolean;
}

function generateStateHash(state: GameState, eventType: string): string {
  const key = `${eventType}_${state.cats.length}_${state.money}_${state.day}_${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

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

      const now = Date.now();
      if (now - lastSnapshotTime.current < debounceMs) {
        log.debug('Debounced - too soon after last snapshot');
        return;
      }

      isCreatingRef.current = true;
      lastSnapshotTime.current = now;

      try {
        log.debug(`Creating ${eventType} snapshot...`);

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
          log.error('Failed to create snapshot:', insertError);
          return;
        }

        log.debug(`Created ${eventType} snapshot successfully`);

        const { data: allSnapshots } = await supabase
          .from('save_snapshots')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (allSnapshots && allSnapshots.length > maxSnapshots) {
          const snapshotsToDelete = allSnapshots.slice(maxSnapshots).map((s) => s.id);
          await supabase.from('save_snapshots').delete().in('id', snapshotsToDelete);
          log.debug(`Pruned ${snapshotsToDelete.length} old snapshots`);
        }
      } catch (err) {
        log.error('Error creating snapshot:', err);
      } finally {
        isCreatingRef.current = false;
      }
    },
    [userId, state, debounceMs, maxSnapshots]
  );

  return { createEventSnapshot, isCreating: isCreatingRef.current };
}