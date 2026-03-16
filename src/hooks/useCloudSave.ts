import { useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { isValidGameState, isCatRelationship, isRelationshipEvent } from '@/types/guards';
import { migrateSaveData, needsMigration, getSaveVersionInfo } from '@/lib/saveMigration';
import { Json } from '@/integrations/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('CloudSync');

/**
 * Generate a simple hash of the game state for comparison
 */
function generateStateHash(gameState: GameState): string {
  const key = `${gameState.cats.length}-${gameState.day}-${gameState.money}-${gameState.cats.map(c => c.id).join(',')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
  maintenanceStreak?: number;
  longestMaintenanceStreak?: number;
  lastMaintenanceDay?: number | null;
}

interface CloudSaveData {
  game_state: GameState;
  kittens_bred: number;
  relationships: RelationshipSaveData;
  last_played_at: string;
}

function isValidRelationshipData(value: unknown): value is RelationshipSaveData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.relationships) || !obj.relationships.every(isCatRelationship)) return false;
  if (!Array.isArray(obj.events) || !obj.events.every(isRelationshipEvent)) return false;
  return true;
}

interface CloudSaveOptions {
  isNewUser?: boolean;
}

export function useCloudSave(userId: string | undefined, onExternalUpdate?: () => void) {
  const lastSaveRef = useRef<string | null>(null);
  const lastSaveTimestampRef = useRef<string | null>(null);
  const [hasExternalUpdate, setHasExternalUpdate] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`game_saves:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_saves',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as { last_played_at?: string };
          const newTimestamp = newRecord.last_played_at;
          
          if (lastSaveTimestampRef.current && newTimestamp) {
            const ourSaveTime = new Date(lastSaveTimestampRef.current).getTime();
            const updateTime = new Date(newTimestamp).getTime();
            const timeDiff = Math.abs(updateTime - ourSaveTime);
            
            if (timeDiff < 5000) {
              log.debug('Ignoring own save update');
              return;
            }
          }
          
          log.info('External update detected on game_saves');
          setHasExternalUpdate(true);
          onExternalUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onExternalUpdate]);

  const cloudSave = useCallback(
    async (
      gameState: GameState,
      kittensBreed: number,
      relationshipData: RelationshipSaveData,
      options?: CloudSaveOptions
    ): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'Not logged in' };

      if (!isLoadedRef.current) {
        log.warn('Blocked save: Cloud data not yet loaded', {
          catsCount: gameState.cats.length,
          day: gameState.day,
          userId: userId.slice(0, 8) + '...',
        });
        return { success: false, error: 'Cloud data not loaded yet' };
      }

      if (gameState.cats.length === 0 && gameState.day > 1) {
        log.warn('Blocked save: Empty cats array on day > 1 suggests data loss');
        return { success: false, error: 'Save blocked - possible data loss detected' };
      }

      if (gameState.cats.length === 0 && gameState.day === 1 && !options?.isNewUser) {
        log.warn('Blocked save: Empty state on day 1 without isNewUser flag', {
          userId: userId.slice(0, 8) + '...',
        });
        return { success: false, error: 'Blocked potential race condition save' };
      }

      log.debug('Save attempt', {
        isLoaded: isLoadedRef.current,
        catsCount: gameState.cats.length,
        day: gameState.day,
        userId: userId.slice(0, 8) + '...',
      });

      const integrityIssues: string[] = [];
      const correctedState = { ...gameState };

      if (typeof correctedState.totalMoneyEarned !== 'number' || correctedState.totalMoneyEarned < 0) {
        integrityIssues.push(`totalMoneyEarned: ${correctedState.totalMoneyEarned} → 0`);
        correctedState.totalMoneyEarned = 0;
      }

      if (typeof correctedState.money !== 'number' || correctedState.money < 0) {
        integrityIssues.push(`money: ${correctedState.money} → 0`);
        correctedState.money = Math.max(0, correctedState.money || 0);
      }

      if (integrityIssues.length > 0) {
        log.warn('Auto-corrected integrity issues:', integrityIssues);
      }

      try {
        const now = new Date().toISOString();
        const catNames = correctedState.cats.map(c => c.name);
        const stateHash = generateStateHash(correctedState);
        
        supabase.from('save_snapshots').insert({
          user_id: userId,
          snapshot_type: 'auto',
          cat_count: correctedState.cats.length,
          cat_names: catNames,
          day: correctedState.day,
          money: correctedState.money,
          game_state_hash: stateHash,
        }).then(({ error: snapError }) => {
          if (snapError) {
            log.error('Snapshot insert failed:', snapError.message);
            supabase.from('error_logs').insert({
              user_id: userId,
              error_type: 'snapshot_insert_failed',
              error_message: snapError.message,
              metadata: {
                cat_count: correctedState.cats.length,
                day: correctedState.day,
                money: correctedState.money,
              },
            }).then(() => {
              log.debug('Snapshot error logged to error_logs');
            });
          } else {
            supabase
              .from('save_snapshots')
              .delete()
              .eq('user_id', userId)
              .order('created_at', { ascending: true })
              .limit(100)
              .then(() => {
                supabase
                  .from('save_snapshots')
                  .select('id, created_at')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .then(({ data: allSnapshots }) => {
                    if (allSnapshots && allSnapshots.length > 10) {
                      const toDelete = allSnapshots.slice(10).map(s => s.id);
                      supabase
                        .from('save_snapshots')
                        .delete()
                        .in('id', toDelete)
                        .then(() => {
                          log.debug('Pruned old snapshots');
                        });
                    }
                  });
              });
          }
        });

        const saveData = {
          user_id: userId,
          game_state: correctedState as unknown as Json,
          kittens_bred: kittensBreed,
          relationships: relationshipData as unknown as Json,
          last_played_at: now,
        };

        const { error } = await supabase
          .from('game_saves')
          .upsert(saveData, { onConflict: 'user_id' });

        if (error) throw error;

        lastSaveRef.current = now;
        lastSaveTimestampRef.current = now;
        setHasExternalUpdate(false);
        return { success: true };
      } catch (err) {
        log.error('Save error:', err);
        return { success: false, error: 'Failed to save to cloud' };
      }
    },
    [userId]
  );

  const cloudLoad = useCallback(async (): Promise<{
    data: CloudSaveData | null;
    error?: string;
  }> => {
    if (!userId) return { data: null, error: 'Not logged in' };

    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        isLoadedRef.current = true;
        log.info('No cloud save found, marking as loaded (new user)');
        return { data: null };
      }

      if (data.last_played_at) {
        lastSaveTimestampRef.current = data.last_played_at;
      }
      
      isLoadedRef.current = true;
      log.info('Cloud data loaded successfully');

      const rawSaveData = {
        game_state: data.game_state,
        kittens_bred: data.kittens_bred,
        relationships: data.relationships,
        last_played_at: data.last_played_at,
      };

      if (needsMigration(rawSaveData)) {
        const versionInfo = getSaveVersionInfo(rawSaveData);
        log.info(`Migrating cloud save from v${versionInfo.currentVersion} to v${versionInfo.targetVersion}`);

        const migrationResult = migrateSaveData(rawSaveData);

        if (!migrationResult.success) {
          const errorResult = migrationResult as { success: false; error: string };
          log.error('Cloud save migration failed:', errorResult.error);
          return { data: null, error: 'Cloud save data could not be migrated' };
        }

        if (migrationResult.warnings.length > 0) {
          log.warn('Cloud migration warnings:', migrationResult.warnings);
        }

        const { error: updateError } = await supabase
          .from('game_saves')
          .update({
            game_state: migrationResult.data.state as unknown as Json,
            kittens_bred: migrationResult.data.kittensBreed,
            relationships: migrationResult.data.relationships as unknown as Json,
            last_played_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          log.error('Failed to save migrated data:', updateError);
        } else {
          log.info('Cloud save migrated and updated');
        }

        setHasExternalUpdate(false);

        return {
          data: {
            game_state: migrationResult.data.state,
            kittens_bred: migrationResult.data.kittensBreed,
            relationships: migrationResult.data.relationships as RelationshipSaveData,
            last_played_at: migrationResult.data.savedAt,
          },
        };
      }

      const gameState = data.game_state as unknown;
      if (!isValidGameState(gameState)) {
        log.error('Cloud load: Invalid game state structure');
        return { data: null, error: 'Cloud save data is corrupted' };
      }

      const rawRelationships = data.relationships as unknown;
      const relationships: RelationshipSaveData = isValidRelationshipData(rawRelationships)
        ? rawRelationships
        : { relationships: [], events: [] };

      setHasExternalUpdate(false);

      return {
        data: {
          game_state: gameState,
          kittens_bred: data.kittens_bred ?? 0,
          relationships,
          last_played_at: data.last_played_at ?? '',
        },
      };
    } catch (err) {
      log.error('Cloud load error:', err);
      return { data: null, error: 'Failed to load from cloud' };
    }
  }, [userId]);

  const hasCloudSave = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      const { data } = await supabase
        .from('game_saves')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  }, [userId]);

  const getLastSaveTime = useCallback(() => lastSaveRef.current, []);

  const clearExternalUpdate = useCallback(() => {
    setHasExternalUpdate(false);
  }, []);

  return {
    cloudSave,
    cloudLoad,
    hasCloudSave,
    getLastSaveTime,
    hasExternalUpdate,
    clearExternalUpdate,
    isLoaded: isLoadedRef.current,
  };
}
