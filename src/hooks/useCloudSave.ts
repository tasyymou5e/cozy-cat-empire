import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';
import { Json } from '@/integrations/supabase/types';

interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
}

interface CloudSaveData {
  game_state: GameState;
  kittens_bred: number;
  relationships: RelationshipSaveData;
  last_played_at: string;
}

export function useCloudSave(userId: string | undefined) {
  const lastSaveRef = useRef<string | null>(null);

  const cloudSave = useCallback(async (
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
  }, [userId]);

  const cloudLoad = useCallback(async (): Promise<{ data: CloudSaveData | null; error?: string }> => {
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

      return {
        data: {
          game_state: data.game_state as unknown as GameState,
          kittens_bred: data.kittens_bred ?? 0,
          relationships: (data.relationships as unknown as RelationshipSaveData) ?? { relationships: [], events: [] },
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
