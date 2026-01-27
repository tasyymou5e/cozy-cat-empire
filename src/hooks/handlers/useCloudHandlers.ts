/**
 * @fileoverview Cloud save/load handlers for CatFarm
 *
 * Manages cloud synchronization including auto-save intervals,
 * manual save/load, and initial cloud load on login.
 * Also handles external updates (e.g., admin modifications).
 *
 * @module hooks/handlers/useCloudHandlers
 */

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave, AutoSaveStats } from '@/hooks/useAutoSave';
import type { CatFarmState } from '../useCatFarmState';
import type { AutoSaveStatus } from '@/components/game/AutoSaveIndicator';

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
  const { toast } = useToast();
  const isReloadingRef = useRef(false);

  // Auto-reload when external update is detected (e.g., admin modified the save)
  useEffect(() => {
    if (cloudSave.hasExternalUpdate && ui.hasLoadedCloud && !isReloadingRef.current) {
      isReloadingRef.current = true;
      console.log('[CloudSync] External update detected - reloading game state');
      
      cloudSave.cloudLoad().then(({ data, error }) => {
        if (error) {
          console.error('[CloudSync] Failed to reload after external update:', error);
          toast({
            title: 'Sync Error',
            description: 'Failed to sync updated data. Please refresh the page.',
            variant: 'destructive',
          });
        } else if (data) {
          console.log('[CloudSync] Reloaded after external update');
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
          playSound?.('success');
          toast({
            title: 'Game Updated',
            description: 'Your game data has been updated.',
          });
        }
        isReloadingRef.current = false;
      }).catch(() => {
        isReloadingRef.current = false;
      });
    }
  }, [cloudSave.hasExternalUpdate, ui.hasLoadedCloud, cloudSave, actions, ui, playSound, toast]);

  // Load cloud save on login
  useEffect(() => {
    if (auth.user && !ui.hasLoadedCloud) {
      console.log('[CloudSync] Starting cloud load for user:', auth.user.id);
      
      cloudSave.cloudLoad().then(({ data, error }) => {
        if (error) {
          console.error('[CloudSync] Cloud load failed:', error);
          ui.setHasLoadedCloud(true); // Mark as loaded to prevent save issues
          return;
        }
        
        if (data) {
          console.log(`[CloudSync] Load success: ${data.game_state.cats?.length ?? 0} cats, day ${data.game_state.day}`);
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
        } else {
          console.log('[CloudSync] No cloud save found - starting fresh');
        }
        ui.setHasLoadedCloud(true);
      }).catch((err) => {
        console.error('[CloudSync] Cloud load exception:', err);
        ui.setHasLoadedCloud(true); // Prevent future issues
      });
    }
  }, [auth.user, ui.hasLoadedCloud, cloudSave, actions, ui]);

  // Auto-save to cloud every 1 minute using the enhanced useAutoSave hook
  // CRITICAL: Only enabled after cloud data has loaded to prevent data loss
  const { stats: autoSaveStats, saveNow } = useAutoSave(
    auth.user?.id,
    state,
    kittensBreed,
    relationshipSystem.getRelationshipSaveData(),
    {
      intervalMs: 60 * 1000, // 1 minute
      enabled: !!auth.user && ui.hasLoadedCloud,
      onSaveStart: () => {
        ui.setCloudSyncing(true);
      },
      onSaveComplete: () => {
        ui.setCloudSyncing(false);
        ui.setLastCloudSave(new Date().toISOString());
      },
      onSaveError: (error, retryCount) => {
        ui.setCloudSyncing(false);
        console.error(`[CloudSync] Auto-save failed after ${retryCount} retries:`, error.message);
        // Optionally show toast for persistent errors
        if (retryCount >= 2) {
          toast({
            title: 'Save Warning',
            description: 'Auto-save failed. Your progress will be saved on your next action.',
            variant: 'destructive',
          });
        }
      },
    }
  );

  // Build auto-save status for the indicator component
  const autoSaveStatus: AutoSaveStatus = {
    isSyncing: ui.cloudSyncing,
    isRetrying: autoSaveStats.isRetrying,
    lastSaveTime: autoSaveStats.lastSaveTime || ui.lastCloudSave,
    lastError: autoSaveStats.lastError,
    saveCount: autoSaveStats.saveCount,
    errorCount: autoSaveStats.errorCount,
  };

  const handleCloudSave = useCallback(async () => {
    if (!auth.user) return;
    if (!ui.hasLoadedCloud) {
      console.warn('[CloudSync] Skipping cloud save - cloud data not yet loaded');
      return;
    }
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
    ui.hasLoadedCloud,
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
    autoSaveStatus,
    triggerManualSave: saveNow,
  };
}
