/**
 * @fileoverview usePortraitReconciliation - Auto-repair missing portrait URLs
 *
 * @module hooks/usePortraitReconciliation
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cat } from '@/types/game';
import { createLogger } from '@/lib/logger';

const log = createLogger('PortraitReconciliation');

export interface MissingPortraitCat {
  catId: string;
  catName: string;
  expectedPortraitUrl: string;
}

interface PortraitReconciliationResult {
  missingPortraits: MissingPortraitCat[];
  isReconciling: boolean;
  reconcilePortraits: () => Promise<void>;
  autoRepairPortraits: () => void;
  repairedCount: number;
}

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
    log.debug('Starting reconciliation check...');

    try {
      const { data: aiLogs, error } = await supabase
        .from('ai_usage_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('function_name', 'generate-cat-portrait')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Failed to fetch AI logs:', error);
        setIsReconciling(false);
        return;
      }

      if (!aiLogs || aiLogs.length === 0) {
        log.debug('No AI portrait logs found');
        setIsReconciling(false);
        hasReconciled.current = true;
        return;
      }

      const portraitMap = new Map<string, string>();
      for (const logEntry of aiLogs) {
        const metadata = logEntry.metadata as Record<string, unknown> | null;
        const catId = metadata?.cat_id as string | undefined;
        const url = metadata?.portrait_url as string | undefined;
        if (catId && url && !portraitMap.has(catId)) {
          portraitMap.set(catId, url);
        }
      }

      log.debug(`Found ${portraitMap.size} portrait URLs in logs`);

      const missing: MissingPortraitCat[] = [];
      for (const cat of cats) {
        const expectedUrl = portraitMap.get(cat.id);
        if (expectedUrl && !cat.portraitUrl) {
          missing.push({ catId: cat.id, catName: cat.name, expectedPortraitUrl: expectedUrl });
        }
      }

      if (missing.length > 0) {
        log.info(`Found ${missing.length} cats with missing portraits:`, missing.map(m => m.catName));
      } else {
        log.debug('All portraits are in sync');
      }

      setMissingPortraits(missing);
      hasReconciled.current = true;
    } catch (err) {
      log.error('Error during reconciliation:', err);
    } finally {
      setIsReconciling(false);
    }
  }, [userId, cats]);

  const autoRepairPortraits = useCallback(() => {
    if (missingPortraits.length === 0) return;

    log.info(`Auto-repairing ${missingPortraits.length} portrait URLs`);

    for (const missing of missingPortraits) {
      updateCat(missing.catId, { portraitUrl: missing.expectedPortraitUrl });
    }

    setRepairedCount(missingPortraits.length);
    setMissingPortraits([]);
  }, [missingPortraits, updateCat]);

  return { missingPortraits, isReconciling, reconcilePortraits, autoRepairPortraits, repairedCount };
}