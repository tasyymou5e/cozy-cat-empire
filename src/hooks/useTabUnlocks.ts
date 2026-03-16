/**
 * @fileoverview Progressive tab unlocking hook
 *
 * Computes which sidebar tabs are unlocked based on player progress.
 * Shows toast notifications when new tabs unlock.
 *
 * @module hooks/useTabUnlocks
 */

import { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  isTabUnlocked,
  getTabUnlockHint,
  PlayerProgressForUnlocks,
} from '@/config/tabUnlocks';
import { TAB_LABELS } from '@/constants/tabs';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'cat-farm-unlocked-tabs';

export interface UseTabUnlocksReturn {
  /** Check if a specific tab is unlocked */
  isUnlocked: (tabId: string) => boolean;
  /** Get unlock hint text for a locked tab */
  getHint: (tabId: string) => string | null;
  /** Set of currently unlocked tab IDs */
  unlockedTabs: Set<string>;
}

export function useTabUnlocks(progress: PlayerProgressForUnlocks): UseTabUnlocksReturn {
  const { toast } = useToast();
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Load previously seen unlocks to avoid re-toasting on reload
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        prevUnlockedRef.current = new Set(JSON.parse(saved));
      }
      initializedRef.current = true;
    } catch {
      initializedRef.current = true;
    }
  }, []);

  const unlockedTabs = useMemo(() => {
    const allTabIds = Object.keys(TAB_LABELS);
    const unlocked = new Set<string>();
    for (const tabId of allTabIds) {
      if (isTabUnlocked(tabId, progress)) {
        unlocked.add(tabId);
      }
    }
    return unlocked;
  }, [progress]);

  // Notify when new tabs unlock
  useEffect(() => {
    if (!initializedRef.current) return;

    const newlyUnlocked: string[] = [];
    unlockedTabs.forEach((tabId) => {
      if (!prevUnlockedRef.current.has(tabId)) {
        newlyUnlocked.push(tabId);
      }
    });

    if (newlyUnlocked.length > 0) {
      for (const tabId of newlyUnlocked) {
        const tabInfo = TAB_LABELS[tabId];
        if (tabInfo) {
          toast({
            title: `🔓 New Tab Unlocked!`,
            description: `${tabInfo.icon} ${tabInfo.label} is now available!`,
          });
        }
      }

      prevUnlockedRef.current = new Set(unlockedTabs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlockedTabs]));
    }
  }, [unlockedTabs, toast]);

  const isUnlocked = useCallback(
    (tabId: string) => unlockedTabs.has(tabId),
    [unlockedTabs]
  );

  const getHint = useCallback(
    (tabId: string) => getTabUnlockHint(tabId),
    []
  );

  return { isUnlocked, getHint, unlockedTabs };
}
