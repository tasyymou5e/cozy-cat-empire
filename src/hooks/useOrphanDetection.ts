/**
 * @fileoverview useOrphanDetection - Detect cats with gallery photos but missing from save
 *
 * Checks for gallery photos that reference cat IDs not present in the
 * current game save. This allows recovery of cats that were lost due
 * to save overwrites or sync issues.
 *
 * @module hooks/useOrphanDetection
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cat, CatBreed, CatPersonality } from '@/types/game';

export interface OrphanedCat {
  catId: string;
  catName: string;
  breed: CatBreed;
  portraitUrl?: string;
  galleryPhotoCount: number;
  lastSeen: string;
}

interface OrphanDetectionResult {
  /** Orphaned cats found in gallery/logs but not in current save */
  orphanedCats: OrphanedCat[];
  /** Whether detection is in progress */
  isChecking: boolean;
  /** Check for orphaned cats */
  checkForOrphans: () => Promise<void>;
  /** Dismiss orphan detection (user chose not to recover) */
  dismissOrphans: () => void;
  /** Whether there are orphans to recover */
  hasOrphans: boolean;
}

/**
 * Hook to detect orphaned cats that have gallery photos but are missing from game save.
 *
 * @param userId - The authenticated user's ID
 * @param currentCatIds - Array of cat IDs currently in the game save
 * @returns Detection state and actions
 *
 * @example
 * ```typescript
 * const { orphanedCats, checkForOrphans, hasOrphans } = useOrphanDetection(
 *   user?.id,
 *   state.cats.map(c => c.id)
 * );
 *
 * useEffect(() => {
 *   if (hasLoadedCloud) checkForOrphans();
 * }, [hasLoadedCloud]);
 * ```
 */
export function useOrphanDetection(
  userId: string | undefined,
  currentCatIds: string[]
): OrphanDetectionResult {
  const [orphanedCats, setOrphanedCats] = useState<OrphanedCat[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const hasChecked = useRef(false);

  const checkForOrphans = useCallback(async () => {
    if (!userId || hasChecked.current) return;

    setIsChecking(true);
    console.log('[OrphanDetection] Checking for orphaned cats...');

    try {
      // 1. Get all gallery photos for this user
      const { data: galleryPhotos, error: galleryError } = await supabase
        .from('gallery_photos')
        .select('cat_id, cat_name')
        .eq('user_id', userId);

      if (galleryError) {
        console.error('[OrphanDetection] Failed to fetch gallery photos:', galleryError);
        setIsChecking(false);
        return;
      }

      // 2. Get AI portraits from ai_usage_log
      const { data: aiLogs, error: aiError } = await supabase
        .from('ai_usage_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('function_name', 'generate-cat-portrait')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (aiError) {
        console.error('[OrphanDetection] Failed to fetch AI logs:', aiError);
      }

      // 3. Find cat IDs referenced in gallery but not in current save
      const galleryCatIds = new Set<string>();
      const catNameMap = new Map<string, string>();

      for (const photo of galleryPhotos || []) {
        galleryCatIds.add(photo.cat_id);
        if (!catNameMap.has(photo.cat_id)) {
          catNameMap.set(photo.cat_id, photo.cat_name);
        }
      }

      const currentCatIdSet = new Set(currentCatIds);

      // Build portrait URL map from AI logs
      const portraitMap = new Map<string, { url: string; breed: CatBreed; createdAt: string }>();
      for (const log of aiLogs || []) {
        const metadata = log.metadata as Record<string, unknown> | null;
        const catId = metadata?.cat_id as string | undefined;
        const url = metadata?.portrait_url as string | undefined;
        const breed = (metadata?.breed as CatBreed) || 'stray';

        if (catId && !portraitMap.has(catId)) {
          portraitMap.set(catId, {
            url: url || '',
            breed,
            createdAt: log.created_at || 'Unknown',
          });
        }
      }

      // Find orphans
      const orphans: OrphanedCat[] = [];
      galleryCatIds.forEach((catId) => {
        if (!currentCatIdSet.has(catId)) {
          const portraitData = portraitMap.get(catId);
          const photoCount = (galleryPhotos || []).filter((p) => p.cat_id === catId).length;

          orphans.push({
            catId,
            catName: catNameMap.get(catId) || 'Unknown',
            breed: portraitData?.breed || 'stray',
            portraitUrl: portraitData?.url,
            galleryPhotoCount: photoCount,
            lastSeen: portraitData?.createdAt || 'Unknown',
          });
        }
      });

      if (orphans.length > 0) {
        console.log(
          `[OrphanDetection] Found ${orphans.length} orphaned cats:`,
          orphans.map((o) => o.catName)
        );
      } else {
        console.log('[OrphanDetection] No orphaned cats found');
      }

      setOrphanedCats(orphans);
      hasChecked.current = true;
    } catch (err) {
      console.error('[OrphanDetection] Error during detection:', err);
    } finally {
      setIsChecking(false);
    }
  }, [userId, currentCatIds]);

  const dismissOrphans = useCallback(() => {
    setOrphanedCats([]);
  }, []);

  return {
    orphanedCats,
    isChecking,
    checkForOrphans,
    dismissOrphans,
    hasOrphans: orphanedCats.length > 0,
  };
}

/**
 * Create a Cat object from orphaned cat data for recovery.
 *
 * @param orphan - Orphaned cat data
 * @returns A full Cat object with default stats
 */
export function createRecoveryCat(orphan: OrphanedCat): Cat {
  return {
    id: orphan.catId, // Keep original ID for portrait URL matching
    type: 'adopted',
    breed: orphan.breed,
    name: orphan.catName,
    health: 100,
    happiness: 100,
    hunger: 50,
    value: 100,
    age: 1,
    personality: 'affectionate' as CatPersonality,
    showWins: 0,
    isForSale: false,
    grade: 1,
    tricksLearned: [],
    trickProgress: {
      sit: 0,
      paw: 0,
      rollOver: 0,
      jump: 0,
      fetch: 0,
    },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
    portraitUrl: orphan.portraitUrl,
  };
}
