/**
 * @fileoverview usePortraitReconciliation - Auto-repair missing portrait URLs
 *
 * Verifies that cats with AI-generated portraits in the usage logs
 * have their `portraitUrl` field populated. If not, auto-repairs them.
 *
 * This prevents data loss scenarios where portrait URLs are lost
 * due to save overwrites or sync issues.
 *
 * @module hooks/usePortraitReconciliation
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cat } from '@/types/game';

export interface MissingPortraitCat {
  catId: string;
  catName: string;
  expectedPortraitUrl: string;
}

interface PortraitReconciliationResult {
  /** Cats that have portraits in AI logs but missing in game state */
  missingPortraits: MissingPortraitCat[];
  /** Whether reconciliation is in progress */
  isReconciling: boolean;
  /** Check for missing portraits */
  reconcilePortraits: () => Promise<void>;
  /** Automatically repair missing portrait URLs */
  autoRepairPortraits: () => void;
  /** Number of portraits repaired in last run */
  repairedCount: number;
}

/**
 * Hook to detect and repair missing portrait URLs on cats.
 *
 * @param userId - The authenticated user's ID
 * @param cats - Current array of cats from game state
 * @param updateCat - Function to update a cat's properties
 * @returns Reconciliation state and actions
 *
 * @example
 * ```typescript
 * const { missingPortraits, reconcilePortraits, autoRepairPortraits } = usePortraitReconciliation(
 *   user?.id,
 *   state.cats,
 *   actions.updateCat
 * );
 *
 * useEffect(() => {
 *   if (hasLoaded) reconcilePortraits();
 * }, [hasLoaded]);
 * ```
 */
export function usePortraitReconciliation(
  userId: string | undefined,
  cats: Cat[],
  updateCat: (catId: string, updates: Partial<Cat>) => void
): PortraitReconciliationResult {
  const [missingPortraits, setMissingPortraits] = useState<MissingPortraitCat[]>([]);
  const [isReconciling, setIsReconciling] = useState(false);
  const [repairedCount, setRepairedCount] = useState(0);
  const hasReconciled = useRef(false);

  const reconcilePortraits = useCallback(async () => {
    if (!userId || cats.length === 0 || hasReconciled.current) return;

    setIsReconciling(true);
    console.log('[PortraitReconciliation] Starting reconciliation check...');

    try {
      // 1. Get all successful AI portrait logs for this user
      const { data: aiLogs, error } = await supabase
        .from('ai_usage_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('function_name', 'generate-cat-portrait')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PortraitReconciliation] Failed to fetch AI logs:', error);
        setIsReconciling(false);
        return;
      }

      if (!aiLogs || aiLogs.length === 0) {
        console.log('[PortraitReconciliation] No AI portrait logs found');
        setIsReconciling(false);
        hasReconciled.current = true;
        return;
      }

      // 2. Build a map of cat_id -> latest portrait_url (most recent first)
      const portraitMap = new Map<string, string>();
      for (const log of aiLogs) {
        const metadata = log.metadata as Record<string, unknown> | null;
        const catId = metadata?.cat_id as string | undefined;
        const url = metadata?.portrait_url as string | undefined;
        if (catId && url && !portraitMap.has(catId)) {
          portraitMap.set(catId, url);
        }
      }

      console.log(`[PortraitReconciliation] Found ${portraitMap.size} portrait URLs in logs`);

      // 3. Find cats that should have portraits but don't
      const missing: MissingPortraitCat[] = [];
      for (const cat of cats) {
        const expectedUrl = portraitMap.get(cat.id);
        if (expectedUrl && !cat.portraitUrl) {
          missing.push({
            catId: cat.id,
            catName: cat.name,
            expectedPortraitUrl: expectedUrl,
          });
        }
      }

      if (missing.length > 0) {
        console.log(`[PortraitReconciliation] Found ${missing.length} cats with missing portraits:`, 
          missing.map(m => m.catName));
      } else {
        console.log('[PortraitReconciliation] All portraits are in sync');
      }

      setMissingPortraits(missing);
      hasReconciled.current = true;
    } catch (err) {
      console.error('[PortraitReconciliation] Error during reconciliation:', err);
    } finally {
      setIsReconciling(false);
    }
  }, [userId, cats]);

  const autoRepairPortraits = useCallback(() => {
    if (missingPortraits.length === 0) return;

    console.log(`[PortraitReconciliation] Auto-repairing ${missingPortraits.length} portrait URLs`);

    for (const missing of missingPortraits) {
      updateCat(missing.catId, { portraitUrl: missing.expectedPortraitUrl });
    }

    setRepairedCount(missingPortraits.length);
    setMissingPortraits([]);
  }, [missingPortraits, updateCat]);

  return {
    missingPortraits,
    isReconciling,
    reconcilePortraits,
    autoRepairPortraits,
    repairedCount,
  };
}
