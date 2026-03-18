/**
 * @fileoverview Cloud save/load handlers for CatFarm
 *
 * @module hooks/handlers/useCloudHandlers
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave, AutoSaveStats } from '@/hooks/useAutoSave';
import { useOrphanDetection, createRecoveryCat, type OrphanedCat } from '@/hooks/useOrphanDetection';
import { useEventSnapshots, type SnapshotEventType } from '@/hooks/useEventSnapshots';
import type { CatFarmState } from '../useCatFarmState';
import type { AutoSaveStatus } from '@/components/game/AutoSaveIndicator';
import { createLogger } from '@/lib/logger';

const log = createLogger('CloudSync');

interface CloudHandlersDeps {
  farmState: CatFarmState;
}

export function useCloudHandlers({ farmState }: CloudHandlersDeps) {
  const {
    sound, auth, state, kittensBreed, relationshipSystem,
    cloudSave, leaderboard, profile, actions, ui,
  } = farmState;

  const { playSound } = sound;
  const { toast } = useToast();
  const isReloadingRef = useRef(false);
  const [showOrphanDialog, setShowOrphanDialog] = useState(false);
  const shouldCheckOrphansRef = useRef(false);

  const currentCatIds = useMemo(() => state.cats.map((c) => c.id), [state.cats]);

  const { orphanedCats, checkForOrphans, dismissOrphans, hasOrphans, isChecking } =
    useOrphanDetection(auth.user?.id, currentCatIds);

  const { createEventSnapshot } = useEventSnapshots(auth.user?.id, state);

  useEffect(() => {
    if (cloudSave.hasExternalUpdate && ui.hasLoadedCloud && !isReloadingRef.current) {
      isReloadingRef.current = true;
      log.info('External update detected - reloading game state');
      
      cloudSave.cloudLoad().then(({ data, error }) => {
        if (error) {
          log.error('Failed to reload after external update:', error);
          toast({
            title: 'Sync Error',
            description: 'Failed to sync updated data. Please refresh the page.',
            variant: 'destructive',
          });
        } else if (data) {
          log.info('Reloaded after external update');
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
          playSound?.('success');
          toast({ title: 'Game Updated', description: 'Your game data has been updated.' });
        }
        isReloadingRef.current = false;
      }).catch(() => {
        isReloadingRef.current = false;
      });
    }
  }, [cloudSave.hasExternalUpdate, ui.hasLoadedCloud, cloudSave, actions, ui, playSound, toast]);

  useEffect(() => {
    if (auth.user && !ui.hasLoadedCloud) {
      log.info('Starting cloud load for user:', auth.user.id);
      
      cloudSave.cloudLoad().then(({ data, error }) => {
        if (error) {
          log.error('Cloud load failed:', error);
          ui.setHasLoadedCloud(true);
          return;
        }
        
        if (data) {
          log.info(`Load success: ${data.game_state.cats?.length ?? 0} cats, day ${data.game_state.day}`);
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
          shouldCheckOrphansRef.current = true;
        } else {
          log.info('No cloud save found - starting fresh');
        }
        ui.setHasLoadedCloud(true);
      }).catch((err) => {
        log.error('Cloud load exception:', err);
        ui.setHasLoadedCloud(true);
      });
    }
  }, [auth.user, ui.hasLoadedCloud, cloudSave, actions, ui, checkForOrphans]);

  // Trigger orphan check after cloud load — works even with 0 cats (empty save)
  useEffect(() => {
    if (shouldCheckOrphansRef.current && ui.hasLoadedCloud) {
      shouldCheckOrphansRef.current = false;
      checkForOrphans();
    }
  }, [currentCatIds, ui.hasLoadedCloud, checkForOrphans]);

  useEffect(() => {
    if (hasOrphans && !isChecking) {
      setShowOrphanDialog(true);
    }
  }, [hasOrphans, isChecking]);

  const { stats: autoSaveStats, saveNow } = useAutoSave(
    auth.user?.id, state, kittensBreed,
    relationshipSystem.getRelationshipSaveData(),
    {
      intervalMs: 60 * 1000,
      enabled: !!auth.user && ui.hasLoadedCloud,
      onSaveStart: () => { ui.setCloudSyncing(true); },
      onSaveComplete: () => {
        ui.setCloudSyncing(false);
        ui.setLastCloudSave(new Date().toISOString());
        // Sync player_stats on every auto-save so admin/leaderboard stays current
        leaderboard.syncPlayerStats(
          state, kittensBreed,
          profile.profile?.display_name || undefined,
          profile.profile?.avatar_emoji || undefined
        ).catch((err) => log.error('Failed to sync player stats after auto-save:', err));
      },
      onSaveError: (error, retryCount) => {
        ui.setCloudSyncing(false);
        log.error(`Auto-save failed after ${retryCount} retries:`, error.message);
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
      log.warn('Skipping cloud save - cloud data not yet loaded');
      return;
    }
    ui.setCloudSyncing(true);
    const result = await cloudSave.cloudSave(
      state, kittensBreed, relationshipSystem.getRelationshipSaveData()
    );
    if (result.success) {
      ui.setLastCloudSave(new Date().toISOString());
      await leaderboard.syncPlayerStats(
        state, kittensBreed,
        profile.profile?.display_name || undefined,
        profile.profile?.avatar_emoji || undefined
      );
      playSound?.('success');
    }
    ui.setCloudSyncing(false);
  }, [auth.user, ui.hasLoadedCloud, state, kittensBreed, relationshipSystem, cloudSave, leaderboard, profile, playSound, ui]);

  const handleCloudLoad = useCallback(async () => {
    if (!auth.user) return;
    const { data } = await cloudSave.cloudLoad();
    if (data) {
      actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
      ui.setLastCloudSave(data.last_played_at);
      playSound?.('success');
    }
  }, [auth.user, cloudSave, actions, playSound, ui]);

  const handleRecoverOrphans = useCallback(async (orphansToRecover: OrphanedCat[]) => {
    log.info(`Recovering ${orphansToRecover.length} orphaned cats`);
    const availableSpace = state.space - state.cats.length;
    const catsToRecover = orphansToRecover.slice(0, availableSpace);
    
    if (catsToRecover.length === 0) {
      toast({
        title: 'No Space Available',
        description: 'Upgrade your housing to make room for recovered cats.',
        variant: 'destructive',
      });
      return;
    }

    for (const orphan of catsToRecover) {
      const recoveredCat = createRecoveryCat(orphan);
      actions.addRecoveredCat?.(recoveredCat);
    }

    const skipped = orphansToRecover.length - catsToRecover.length;
    toast({
      title: 'Cats Recovered! 🎉',
      description: skipped > 0
        ? `Recovered ${catsToRecover.length} cat${catsToRecover.length !== 1 ? 's' : ''}. ${skipped} couldn't fit — upgrade your housing!`
        : `Successfully recovered ${catsToRecover.length} lost cat${catsToRecover.length !== 1 ? 's' : ''}.`,
    });
    playSound?.('success');
    setShowOrphanDialog(false);
    dismissOrphans();
  }, [actions, toast, playSound, dismissOrphans, state.space, state.cats.length]);

  const handleDismissOrphans = useCallback(() => {
    setShowOrphanDialog(false);
    dismissOrphans();
  }, [dismissOrphans]);

  return {
    handleCloudSave, handleCloudLoad, autoSaveStatus,
    triggerManualSave: saveNow,
    orphanedCats, showOrphanDialog, handleRecoverOrphans, handleDismissOrphans,
    createEventSnapshot,
  };
}