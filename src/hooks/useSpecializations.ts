import { useState, useEffect, useCallback, useMemo } from 'react';
import { Cat } from '@/types/game';
import {
  CatSpecialization,
  SpecializationType,
  SPECIALIZATIONS,
  checkSpecializationEligibility,
  getMasteryLevel,
  getNextMasteryLevel,
} from '@/types/specializations';

interface UseSpecializationsReturn {
  specializations: CatSpecialization[];
  specializeCat: (catId: string, type: SpecializationType) => boolean;
  getSpecialization: (catId: string) => CatSpecialization | undefined;
  addXP: (catId: string, amount: number) => void;
  canSpecialize: (cat: Cat, friendshipCount: number, kittenCount: number) => ReturnType<typeof checkSpecializationEligibility>;
  getActiveBonuses: () => {
    showScoreBonus: number;
    showMoneyBonus: number;
    relationshipBonus: number;
    kittenGradeBonus: number;
    kittenHealthBonus: number;
    breedingSuccessBonus: number;
  };
  getSpecializedCats: (cats: Cat[]) => Array<Cat & { specialization: CatSpecialization }>;
}

const STORAGE_KEY = 'cat-farm-specializations';

export function useSpecializations(): UseSpecializationsReturn {
  const [specializations, setSpecializations] = useState<CatSpecialization[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specializations));
  }, [specializations]);

  // Check if cat can specialize
  const canSpecialize = useCallback((cat: Cat, friendshipCount: number, kittenCount: number) => {
    // Already specialized?
    const existing = specializations.find(s => s.catId === cat.id);
    if (existing) {
      return {
        isEligible: false,
        meetsGrade: true,
        meetsAdditional: true,
        eligiblePaths: [] as SpecializationType[],
      };
    }
    return checkSpecializationEligibility(cat, friendshipCount, kittenCount);
  }, [specializations]);

  // Specialize a cat
  const specializeCat = useCallback((catId: string, type: SpecializationType): boolean => {
    // Check if already specialized
    if (specializations.some(s => s.catId === catId)) return false;

    const newSpec: CatSpecialization = {
      catId,
      specialization: type,
      level: 1,
      xp: 0,
      specializedAt: new Date().toISOString(),
    };

    setSpecializations(prev => [...prev, newSpec]);
    return true;
  }, [specializations]);

  // Get specialization for a cat
  const getSpecialization = useCallback((catId: string) => {
    return specializations.find(s => s.catId === catId);
  }, [specializations]);

  // Add XP to a specialized cat
  const addXP = useCallback((catId: string, amount: number) => {
    setSpecializations(prev => prev.map(s => {
      if (s.catId !== catId) return s;
      
      const newXP = s.xp + amount;
      const newLevel = getMasteryLevel(newXP).level;
      
      return {
        ...s,
        xp: newXP,
        level: newLevel,
      };
    }));
  }, []);

  // Calculate active bonuses from all specialized cats
  const getActiveBonuses = useCallback(() => {
    let showScoreBonus = 0;
    let showMoneyBonus = 0;
    let relationshipBonus = 0;
    let kittenGradeBonus = 0;
    let kittenHealthBonus = 0;
    let breedingSuccessBonus = 0;

    for (const spec of specializations) {
      const specDef = SPECIALIZATIONS[spec.specialization];
      const mastery = getMasteryLevel(spec.xp);
      const multiplier = mastery.bonusMultiplier;

      for (const bonus of specDef.bonuses) {
        const value = bonus.value * multiplier;
        switch (bonus.type) {
          case 'show_score':
            showScoreBonus += value;
            break;
          case 'show_money':
            showMoneyBonus += value;
            break;
          case 'relationship_gain':
            relationshipBonus += value;
            break;
          case 'kitten_grade':
            kittenGradeBonus += value;
            break;
          case 'kitten_health':
            kittenHealthBonus += value;
            break;
          case 'breeding_success':
            breedingSuccessBonus += value;
            break;
        }
      }
    }

    return {
      showScoreBonus,
      showMoneyBonus,
      relationshipBonus,
      kittenGradeBonus,
      kittenHealthBonus,
      breedingSuccessBonus,
    };
  }, [specializations]);

  // Get cats with their specialization data
  const getSpecializedCats = useCallback((cats: Cat[]) => {
    return cats
      .filter(cat => specializations.some(s => s.catId === cat.id))
      .map(cat => ({
        ...cat,
        specialization: specializations.find(s => s.catId === cat.id)!,
      }));
  }, [specializations]);

  return {
    specializations,
    specializeCat,
    getSpecialization,
    addXP,
    canSpecialize,
    getActiveBonuses,
    getSpecializedCats,
  };
}
