import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cat } from '@/types/game';
import { 
  LegacyCat, 
  LegacyTrait,
  checkRetirementEligibility, 
  determineLegacyTrait, 
  calculateLegacyBonus,
} from '@/types/legacy';

interface UseLegacyReturn {
  retiredCats: LegacyCat[];
  totalLegacyBonus: number;
  activeLegacyTraits: LegacyTrait[];
  retireCat: (cat: Cat, gameDay: number) => Promise<LegacyCat | null>;
  canRetire: (cat: Cat) => boolean;
  getEligibility: (cat: Cat) => ReturnType<typeof checkRetirementEligibility>;
  getKittenBonuses: () => {
    gradeBonus: number;
    healthBonus: number;
    trainingBonus: number;
    relationshipBonus: number;
  };
  loading: boolean;
}

const STORAGE_KEY = 'cat-farm-hall-of-fame';

export function useLegacy(userId?: string): UseLegacyReturn {
  const [retiredCats, setRetiredCats] = useState<LegacyCat[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(false);

  // Load from cloud when user is authenticated
  useEffect(() => {
    if (!userId) return;

    const loadFromCloud = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('retired_cats')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading retired cats:', error);
          return;
        }

        if (data && data.length > 0) {
          const legacyCats: LegacyCat[] = data.map(row => ({
            id: row.id,
            cat: row.cat_data as unknown as Cat,
            retiredAt: row.retired_at_day,
            retiredDate: row.retired_date ?? new Date().toISOString(),
            achievements: row.achievements as LegacyCat['achievements'],
            legacyBonus: Number(row.legacy_bonus),
            legacyTrait: row.legacy_trait as LegacyTrait,
          }));
          setRetiredCats(legacyCats);
        } else if (retiredCats.length > 0) {
          // Migrate local data to cloud
          for (const legacy of retiredCats) {
            await supabase
              .from('retired_cats')
              .insert({
                user_id: userId,
                cat_data: JSON.parse(JSON.stringify(legacy.cat)),
                retired_at_day: legacy.retiredAt,
                retired_date: legacy.retiredDate,
                achievements: legacy.achievements,
                legacy_bonus: legacy.legacyBonus,
                legacy_trait: legacy.legacyTrait,
              } as any);
          }
        }
      } catch (e) {
        console.error('Failed to load retired cats from cloud:', e);
      } finally {
        setLoading(false);
      }
    };

    loadFromCloud();
  }, [userId]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(retiredCats));
  }, [retiredCats]);

  // Calculate total passive bonus
  const totalLegacyBonus = useMemo(() => {
    return retiredCats.reduce((sum, legacy) => sum + legacy.legacyBonus, 0);
  }, [retiredCats]);

  // Get all active legacy traits
  const activeLegacyTraits = useMemo(() => {
    return [...new Set(retiredCats.map(l => l.legacyTrait))];
  }, [retiredCats]);

  // Check if cat can be retired
  const canRetire = useCallback((cat: Cat): boolean => {
    if (retiredCats.some(l => l.cat.id === cat.id)) return false;
    const eligibility = checkRetirementEligibility(cat);
    return eligibility.isEligible;
  }, [retiredCats]);

  // Get detailed eligibility
  const getEligibility = useCallback((cat: Cat) => {
    return checkRetirementEligibility(cat);
  }, []);

  // Retire a cat
  const retireCat = useCallback(async (cat: Cat, gameDay: number): Promise<LegacyCat | null> => {
    if (!canRetire(cat)) return null;

    const eligibility = checkRetirementEligibility(cat);
    const legacyTrait = determineLegacyTrait(eligibility);
    const legacyBonus = calculateLegacyBonus(eligibility);

    const achievements: LegacyCat['achievements'] = [];
    if (eligibility.meetsShowWins) achievements.push('show_champion');
    if (eligibility.meetsGrade) achievements.push('perfect_grade');
    if (eligibility.meetsAge) achievements.push('elder');
    if (eligibility.meetsTricks) achievements.push('trick_master');
    if (eligibility.achievementCount === 4) achievements.push('legendary');

    const legacyCat: LegacyCat = {
      id: `legacy_${cat.id}_${Date.now()}`,
      cat: { ...cat },
      retiredAt: gameDay,
      retiredDate: new Date().toISOString(),
      achievements,
      legacyBonus,
      legacyTrait,
    };

    // Save to cloud if logged in
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('retired_cats')
          .insert({
            user_id: userId,
            cat_data: JSON.parse(JSON.stringify(legacyCat.cat)),
            retired_at_day: legacyCat.retiredAt,
            retired_date: legacyCat.retiredDate,
            achievements: legacyCat.achievements,
            legacy_bonus: legacyCat.legacyBonus,
            legacy_trait: legacyCat.legacyTrait,
          } as any)
          .select()
          .single();

        if (error) {
          console.error('Error saving retired cat to cloud:', error);
        } else if (data) {
          legacyCat.id = data.id;
        }
      } catch (e) {
        console.error('Failed to save retired cat to cloud:', e);
      }
    }

    setRetiredCats(prev => [...prev, legacyCat]);
    return legacyCat;
  }, [canRetire, userId]);

  // Calculate kitten bonuses based on legacy traits
  const getKittenBonuses = useCallback(() => {
    let gradeBonus = 0;
    let healthBonus = 0;
    let trainingBonus = 0;
    let relationshipBonus = 0;

    for (const legacy of retiredCats) {
      switch (legacy.legacyTrait) {
        case 'show_lineage':
          gradeBonus += 2;
          break;
        case 'healthy_genes':
          healthBonus += 10;
          break;
        case 'quick_learner':
          trainingBonus += 20;
          break;
        case 'social_nature':
          relationshipBonus += 5;
          break;
        case 'golden_legacy':
          gradeBonus += 2;
          healthBonus += 10;
          trainingBonus += 20;
          relationshipBonus += 5;
          break;
      }
    }

    return { gradeBonus, healthBonus, trainingBonus, relationshipBonus };
  }, [retiredCats]);

  return {
    retiredCats,
    totalLegacyBonus,
    activeLegacyTraits,
    retireCat,
    canRetire,
    getEligibility,
    getKittenBonuses,
    loading,
  };
}
