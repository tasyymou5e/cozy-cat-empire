import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cat } from '@/types/game';
import { 
  LegacyCat, 
  LegacyTrait,
  checkRetirementEligibility, 
  determineLegacyTrait, 
  calculateLegacyBonus,
  RETIREMENT_REQUIREMENTS,
} from '@/types/legacy';

interface UseLegacyReturn {
  retiredCats: LegacyCat[];
  totalLegacyBonus: number; // Total passive bonus from all retired cats
  activeLegacyTraits: LegacyTrait[];
  retireCat: (cat: Cat, gameDay: number) => LegacyCat | null;
  canRetire: (cat: Cat) => boolean;
  getEligibility: (cat: Cat) => ReturnType<typeof checkRetirementEligibility>;
  getKittenBonuses: () => {
    gradeBonus: number;
    healthBonus: number;
    trainingBonus: number;
    relationshipBonus: number;
  };
}

const STORAGE_KEY = 'cat-farm-hall-of-fame';

export function useLegacy(): UseLegacyReturn {
  const [retiredCats, setRetiredCats] = useState<LegacyCat[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

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
    // Can't retire if already in hall of fame
    if (retiredCats.some(l => l.cat.id === cat.id)) return false;
    
    const eligibility = checkRetirementEligibility(cat);
    return eligibility.isEligible;
  }, [retiredCats]);

  // Get detailed eligibility
  const getEligibility = useCallback((cat: Cat) => {
    return checkRetirementEligibility(cat);
  }, []);

  // Retire a cat
  const retireCat = useCallback((cat: Cat, gameDay: number): LegacyCat | null => {
    if (!canRetire(cat)) return null;

    const eligibility = checkRetirementEligibility(cat);
    const legacyTrait = determineLegacyTrait(eligibility);
    const legacyBonus = calculateLegacyBonus(eligibility);

    // Determine achievements
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

    setRetiredCats(prev => [...prev, legacyCat]);
    return legacyCat;
  }, [canRetire]);

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
  };
}
