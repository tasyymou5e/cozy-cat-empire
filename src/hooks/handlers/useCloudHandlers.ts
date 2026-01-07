/**
 * @fileoverview Cloud save/load handlers for CatFarm
 *
 * Manages cloud synchronization including auto-save intervals,
 * manual save/load, and initial cloud load on login.
 *
 * @module hooks/handlers/useCloudHandlers
 */

import { useCallback, useEffect } from 'react';
import type { CatFarmState } from '../useCatFarmState';

interface CloudHandlersDeps {
  farmState: CatFarmState;
}

/**
 * Hook providing cloud save/load handlers and effects
 */
export function useCloudHandlers({ farmState }: CloudHandlersDeps) {
  const {
    sound,
    auth,
    state,
    kittensBreed,
    relationshipSystem,
    cloudSave,
    leaderboard,
    profile,
    actions,
    ui,
  } = farmState;

  const { playSound } = sound;

  // Load cloud save on login
  useEffect(() => {
    if (auth.user && !ui.hasLoadedCloud) {
      cloudSave.cloudLoad().then(({ data }) => {
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
        }
        ui.setHasLoadedCloud(true);
      });
    }
  }, [auth.user, ui.hasLoadedCloud, cloudSave, actions, ui]);

  // Auto-save to cloud every 5 minutes
  useEffect(() => {
    if (!auth.user) return;

    const interval = setInterval(
      async () => {
        ui.setCloudSyncing(true);
        const result = await cloudSave.cloudSave(
          state,
          kittensBreed,
          relationshipSystem.getRelationshipSaveData()
        );
        if (result.success) {
          ui.setLastCloudSave(new Date().toISOString());
        }
        ui.setCloudSyncing(false);
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [auth.user, state, kittensBreed, relationshipSystem, cloudSave, ui]);

  const handleCloudSave = useCallback(async () => {
    if (!auth.user) return;
    ui.setCloudSyncing(true);
    const result = await cloudSave.cloudSave(
      state,
      kittensBreed,
      relationshipSystem.getRelationshipSaveData()
    );
    if (result.success) {
      ui.setLastCloudSave(new Date().toISOString());
      await leaderboard.syncPlayerStats(
        state,
        kittensBreed,
        profile.profile?.display_name || undefined,
        profile.profile?.avatar_emoji || undefined
      );
      playSound?.('success');
    }
    ui.setCloudSyncing(false);
  }, [
    auth.user,
    state,
    kittensBreed,
    relationshipSystem,
    cloudSave,
    leaderboard,
    profile,
    playSound,
    ui,
  ]);

  const handleCloudLoad = useCallback(async () => {
    if (!auth.user) return;
    const { data } = await cloudSave.cloudLoad();
    if (data) {
      actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
      ui.setLastCloudSave(data.last_played_at);
      playSound?.('success');
    }
  }, [auth.user, cloudSave, actions, playSound, ui]);

  return {
    handleCloudSave,
    handleCloudLoad,
  };
}
