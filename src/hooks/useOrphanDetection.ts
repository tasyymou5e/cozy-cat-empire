/**
 * @fileoverview useOrphanDetection - Detect cats with gallery photos but missing from save
 *
 * @module hooks/useOrphanDetection
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cat, CatBreed, CatPersonality } from '@/types/game';
import { createLogger } from '@/lib/logger';

const log = createLogger('OrphanDetection');

export interface OrphanedCat {
  catId: string;
  catName: string;
  breed: CatBreed;
  portraitUrl?: string;
  galleryPhotoCount: number;
  lastSeen: string;
}

interface OrphanDetectionResult {
  orphanedCats: OrphanedCat[];
  isChecking: boolean;
  checkForOrphans: () => Promise<void>;
  dismissOrphans: () => void;
  hasOrphans: boolean;
}

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
    log.debug('Checking for orphaned cats...');

    try {
      const { data: galleryPhotos, error: galleryError } = await supabase
        .from('gallery_photos')
        .select('cat_id, cat_name')
        .eq('user_id', userId);

      if (galleryError) {
        log.error('Failed to fetch gallery photos:', galleryError);
        setIsChecking(false);
        return;
      }

      const { data: aiLogs, error: aiError } = await supabase
        .from('ai_usage_log')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .eq('function_name', 'generate-cat-portrait')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (aiError) {
        log.error('Failed to fetch AI logs:', aiError);
      }

      const galleryCatIds = new Set<string>();
      const catNameMap = new Map<string, string>();

      for (const photo of galleryPhotos || []) {
        galleryCatIds.add(photo.cat_id);
        if (!catNameMap.has(photo.cat_id)) {
          catNameMap.set(photo.cat_id, photo.cat_name);
        }
      }

      const currentCatIdSet = new Set(currentCatIds);

      const portraitMap = new Map<string, { url: string; breed: CatBreed; createdAt: string }>();
      for (const logEntry of aiLogs || []) {
        const metadata = logEntry.metadata as Record<string, unknown> | null;
        const catId = metadata?.cat_id as string | undefined;
        const url = metadata?.portrait_url as string | undefined;
        const breed = (metadata?.breed as CatBreed) || 'stray';

        if (catId && !portraitMap.has(catId)) {
          portraitMap.set(catId, { url: url || '', breed, createdAt: logEntry.created_at || 'Unknown' });
        }
      }

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
        log.info(`Found ${orphans.length} orphaned cats:`, orphans.map((o) => o.catName));
      } else {
        log.debug('No orphaned cats found');
      }

      setOrphanedCats(orphans);
      hasChecked.current = true;
    } catch (err) {
      log.error('Error during detection:', err);
    } finally {
      setIsChecking(false);
    }
  }, [userId, currentCatIds]);

  const dismissOrphans = useCallback(() => {
    setOrphanedCats([]);
  }, []);

  return { orphanedCats, isChecking, checkForOrphans, dismissOrphans, hasOrphans: orphanedCats.length > 0 };
}

export function createRecoveryCat(orphan: OrphanedCat): Cat {
  return {
    id: orphan.catId,
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
    trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
    portraitUrl: orphan.portraitUrl,
  };
}