import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cat } from '@/types/game';
import {
  CollectionProgress,
  CollectionCategory,
  BREED_COLLECTION,
  PERSONALITY_COLLECTION,
  TRICK_COLLECTION,
} from '@/types/collections';
import { COSTUMES } from '@/types/costumes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UseCollectionProgressReturn {
  progress: CollectionProgress;
  breedProgress: {
    collected: number;
    total: number;
    items: { id: string; name: string; emoji: string; collected: boolean }[];
  };
  personalityProgress: {
    collected: number;
    total: number;
    items: { id: string; name: string; emoji: string; collected: boolean }[];
  };
  costumeProgress: {
    collected: number;
    total: number;
    items: { id: string; name: string; emoji: string; collected: boolean }[];
  };
  trickProgress: {
    collected: number;
    total: number;
    items: { id: string; name: string; emoji: string; collected: boolean }[];
  };
  overallProgress: number;
  newlyCompletedSet: CollectionCategory | null;
  clearNewlyCompleted: () => void;
  getSetReward: (category: CollectionCategory) => {
    coins?: number;
    title?: string;
    bonus?: string;
  };
}

const STORAGE_KEY = 'cat-farm-collection-progress';

const SET_REWARDS: Record<CollectionCategory, { coins?: number; title?: string; bonus?: string }> =
  {
    breeds: { coins: 500, title: 'Breed Master', bonus: '+5% show score' },
    personalities: { coins: 300, title: 'Cat Whisperer', bonus: '+5% happiness' },
    costumes: { coins: 750, title: 'Fashion Icon' },
    tricks: { coins: 400, title: 'Trick Master', bonus: '+10% training speed' },
  };

export function useCollectionProgress(
  cats: Cat[],
  ownedCostumes: string[]
): UseCollectionProgressReturn {
  const { user } = useAuth();

  const [completedSets, setCompletedSets] = useState<CollectionCategory[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [newlyCompletedSet, setNewlyCompletedSet] = useState<CollectionCategory | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Load from cloud on mount
  useEffect(() => {
    if (!user?.id || cloudLoaded) return;

    const loadFromCloud = async () => {
      const { data } = await supabase
        .from('player_progress')
        .select('completed_sets')
        .eq('user_id', user.id)
        .single();

      if (data && data.completed_sets) {
        const cloudSets = data.completed_sets as CollectionCategory[];
        const merged = [...new Set([...completedSets, ...cloudSets])];
        setCompletedSets(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      setCloudLoaded(true);
    };

    loadFromCloud();
  }, [user?.id, cloudLoaded]);

  // Sync to cloud when completedSets changes
  useEffect(() => {
    if (!user?.id || !cloudLoaded || completedSets.length === 0) return;

    const syncToCloud = async () => {
      await supabase.from('player_progress').upsert(
        {
          user_id: user.id,
          completed_sets: completedSets,
        },
        { onConflict: 'user_id' }
      );
    };

    syncToCloud();
  }, [user?.id, completedSets, cloudLoaded]);

  // Calculate what's collected based on current cats
  const collectedBreeds = useMemo(() => {
    return [...new Set(cats.map((c) => c.breed))];
  }, [cats]);

  const collectedPersonalities = useMemo(() => {
    return [...new Set(cats.map((c) => c.personality))];
  }, [cats]);

  const collectedTricks = useMemo(() => {
    const allTricks = cats.flatMap((c) => c.tricksLearned || []);
    return [...new Set(allTricks)];
  }, [cats]);

  // Build progress items
  const breedProgress = useMemo(() => {
    const items = BREED_COLLECTION.map((b) => ({
      ...b,
      collected: collectedBreeds.includes(b.id),
    }));
    return {
      collected: items.filter((i) => i.collected).length,
      total: items.length,
      items,
    };
  }, [collectedBreeds]);

  const personalityProgress = useMemo(() => {
    const items = PERSONALITY_COLLECTION.map((p) => ({
      ...p,
      collected: collectedPersonalities.includes(p.id),
    }));
    return {
      collected: items.filter((i) => i.collected).length,
      total: items.length,
      items,
    };
  }, [collectedPersonalities]);

  const costumeProgress = useMemo(() => {
    const items = COSTUMES.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      collected: ownedCostumes.includes(c.id),
    }));
    return {
      collected: items.filter((i) => i.collected).length,
      total: items.length,
      items,
    };
  }, [ownedCostumes]);

  const trickProgress = useMemo(() => {
    const items = TRICK_COLLECTION.map((t) => ({
      ...t,
      collected: collectedTricks.includes(t.id as any),
    }));
    return {
      collected: items.filter((i) => i.collected).length,
      total: items.length,
      items,
    };
  }, [collectedTricks]);

  // Check for newly completed sets
  useEffect(() => {
    const checkSet = (category: CollectionCategory, collected: number, total: number) => {
      if (collected === total && !completedSets.includes(category)) {
        setCompletedSets((prev) => {
          const updated = [...prev, category];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        setNewlyCompletedSet(category);
      }
    };

    checkSet('breeds', breedProgress.collected, breedProgress.total);
    checkSet('personalities', personalityProgress.collected, personalityProgress.total);
    checkSet('costumes', costumeProgress.collected, costumeProgress.total);
    checkSet('tricks', trickProgress.collected, trickProgress.total);
  }, [breedProgress, personalityProgress, costumeProgress, trickProgress, completedSets]);

  const overallProgress = useMemo(() => {
    const totalCollected =
      breedProgress.collected +
      personalityProgress.collected +
      costumeProgress.collected +
      trickProgress.collected;
    const totalItems =
      breedProgress.total + personalityProgress.total + costumeProgress.total + trickProgress.total;
    return Math.round((totalCollected / totalItems) * 100);
  }, [breedProgress, personalityProgress, costumeProgress, trickProgress]);

  const clearNewlyCompleted = useCallback(() => {
    setNewlyCompletedSet(null);
  }, []);

  const getSetReward = useCallback((category: CollectionCategory) => {
    return SET_REWARDS[category];
  }, []);

  return {
    progress: {
      breeds: collectedBreeds,
      personalities: collectedPersonalities,
      costumes: ownedCostumes,
      tricks: collectedTricks,
      completedSets,
    },
    breedProgress,
    personalityProgress,
    costumeProgress,
    trickProgress,
    overallProgress,
    newlyCompletedSet,
    clearNewlyCompleted,
    getSetReward,
  };
}
