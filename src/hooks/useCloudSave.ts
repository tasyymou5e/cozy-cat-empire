import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { isValidGameState, isCatRelationship, isRelationshipEvent } from '@/types/guards';
import { migrateSaveData, needsMigration, getSaveVersionInfo } from '@/lib/saveMigration';
import { Json } from '@/integrations/supabase/types';

interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
  // Maintenance streak tracking
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

/** Validate relationship save data structure */
function isValidRelationshipData(value: unknown): value is RelationshipSaveData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (!Array.isArray(obj.relationships) || !obj.relationships.every(isCatRelationship)) {
    return false;
  }
  if (!Array.isArray(obj.events) || !obj.events.every(isRelationshipEvent)) {
    return false;
  }

  return true;
}

/**
 * useCloudSave - Cloud save/load functionality for game persistence
 *
 * Provides functions to save and load game state to/from the cloud database.
 * Requires user authentication to function.
 *
 * @param userId - The authenticated user's ID
 *
 * @returns Object containing:
 * - `cloudSave` - Save game state to cloud
 * - `cloudLoad` - Load game state from cloud
 * - `hasCloudSave` - Check if cloud save exists
 * - `getLastSaveTime` - Get timestamp of last save
 *
 * @example
 * ```tsx
 * const { cloudSave, cloudLoad, hasCloudSave } = useCloudSave(user?.id);
 * await cloudSave(gameState, kittensBreed, relationshipData);
 * const { data } = await cloudLoad();
 * ```
 */
export function useCloudSave(userId: string | undefined) {
  const lastSaveRef = useRef<string | null>(null);

  const cloudSave = useCallback(
    async (
      gameState: GameState,
      kittensBreed: number,
      relationshipData: RelationshipSaveData
    ): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'Not logged in' };
      }

      try {
        const saveData = {
          user_id: userId,
          game_state: gameState as unknown as Json,
          kittens_bred: kittensBreed,
          relationships: relationshipData as unknown as Json,
          last_played_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('game_saves')
          .upsert(saveData, { onConflict: 'user_id' });

        if (error) throw error;

        lastSaveRef.current = new Date().toISOString();
        return { success: true };
      } catch (err) {
        console.error('Cloud save error:', err);
        return { success: false, error: 'Failed to save to cloud' };
      }
    },
    [userId]
  );

  const cloudLoad = useCallback(async (): Promise<{
    data: CloudSaveData | null;
    error?: string;
  }> => {
    if (!userId) {
      return { data: null, error: 'Not logged in' };
    }

    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { data: null };
      }

      // Build raw save data for migration check
      const rawSaveData = {
        game_state: data.game_state,
        kittens_bred: data.kittens_bred,
        relationships: data.relationships,
        last_played_at: data.last_played_at,
      };

      // Check if migration is needed
      if (needsMigration(rawSaveData)) {
        const versionInfo = getSaveVersionInfo(rawSaveData);
        console.log(`Migrating cloud save from v${versionInfo.currentVersion} to v${versionInfo.targetVersion}`);

        const migrationResult = migrateSaveData(rawSaveData);

        if (!migrationResult.success) {
          const errorResult = migrationResult as { success: false; error: string };
          console.error('Cloud save migration failed:', errorResult.error);
          return { data: null, error: 'Cloud save data could not be migrated' };
        }

        if (migrationResult.warnings.length > 0) {
          console.warn('Cloud migration warnings:', migrationResult.warnings);
        }

        // Save the migrated data back to cloud
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
          console.error('Failed to save migrated data:', updateError);
        } else {
          console.log('Cloud save migrated and updated');
        }

        return {
          data: {
            game_state: migrationResult.data.state,
            kittens_bred: migrationResult.data.kittensBreed,
            relationships: migrationResult.data.relationships as RelationshipSaveData,
            last_played_at: migrationResult.data.savedAt,
          },
        };
      }

      // No migration needed - validate as before
      const gameState = data.game_state as unknown;
      if (!isValidGameState(gameState)) {
        console.error('Cloud load: Invalid game state structure');
        return { data: null, error: 'Cloud save data is corrupted' };
      }

      // Validate relationship data with fallback
      const rawRelationships = data.relationships as unknown;
      const relationships: RelationshipSaveData = isValidRelationshipData(rawRelationships)
        ? rawRelationships
        : { relationships: [], events: [] };

      return {
        data: {
          game_state: gameState,
          kittens_bred: data.kittens_bred ?? 0,
          relationships,
          last_played_at: data.last_played_at ?? '',
        },
      };
    } catch (err) {
      console.error('Cloud load error:', err);
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

  return {
    cloudSave,
    cloudLoad,
    hasCloudSave,
    getLastSaveTime,
  };
}
