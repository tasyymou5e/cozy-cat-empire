import { useCallback, useMemo, useEffect } from 'react';
import { Cat, CatSpecializationData } from '@/types/game';
import {
  SpecializationType,
  SPECIALIZATIONS,
  checkSpecializationEligibility,
  getMasteryLevel,
  getNextMasteryLevel,
} from '@/types/specializations';

const LEGACY_STORAGE_KEY = 'cat-farm-specializations';

interface UseSpecializationsReturn {
  /** Check if a cat can specialize */
  canSpecialize: (cat: Cat, friendshipCount: number, kittenCount: number) => ReturnType<typeof checkSpecializationEligibility>;
  /** Get specialization data from a cat */
  getSpecialization: (cat: Cat) => CatSpecializationData | undefined;
  /** Calculate active bonuses from all specialized cats */
  getActiveBonuses: (cats: Cat[]) => {
    showScoreBonus: number;
    showMoneyBonus: number;
    relationshipBonus: number;
    kittenGradeBonus: number;
    kittenHealthBonus: number;
    breedingSuccessBonus: number;
  };
  /** Get all cats with specializations */
  getSpecializedCats: (cats: Cat[]) => Array<Cat & { specializationData: CatSpecializationData }>;
  /** Migrate legacy localStorage data (call once on mount) */
  migrateLegacyData: (cats: Cat[], setSpecialization: (catId: string, type: SpecializationType) => void) => void;
}

/**
 * useSpecializations - Stateless specialization utilities
 * 
 * Specialization data now lives in Cat.specialization field.
 * This hook provides helper functions to work with that data.
 * 
 * To modify specializations, use game actions:
 * - actions.setSpecialization(catId, type)
 * - actions.addSpecializationXP(catId, amount)
 */
export function useSpecializations(): UseSpecializationsReturn {
  
  // Check if cat can specialize
  const canSpecialize = useCallback((cat: Cat, friendshipCount: number, kittenCount: number) => {
    // Already specialized?
    if (cat.specialization) {
      return {
        isEligible: false,
        meetsGrade: true,
        meetsAdditional: true,
        eligiblePaths: [] as SpecializationType[],
      };
    }
    return checkSpecializationEligibility(cat, friendshipCount, kittenCount);
  }, []);

  // Get specialization from a cat (simple accessor)
  const getSpecialization = useCallback((cat: Cat): CatSpecializationData | undefined => {
    return cat.specialization;
  }, []);

  // Calculate active bonuses from all specialized cats
  const getActiveBonuses = useCallback((cats: Cat[]) => {
    let showScoreBonus = 0;
    let showMoneyBonus = 0;
    let relationshipBonus = 0;
    let kittenGradeBonus = 0;
    let kittenHealthBonus = 0;
    let breedingSuccessBonus = 0;

    for (const cat of cats) {
      if (!cat.specialization) continue;
      
      const specDef = SPECIALIZATIONS[cat.specialization.type];
      const mastery = getMasteryLevel(cat.specialization.xp);
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
  }, []);

  // Get cats with their specialization data
  const getSpecializedCats = useCallback((cats: Cat[]) => {
    return cats
      .filter(cat => cat.specialization)
      .map(cat => ({
        ...cat,
        specializationData: cat.specialization!,
      }));
  }, []);

  // Migrate legacy localStorage data to Cat objects
  const migrateLegacyData = useCallback((
    cats: Cat[], 
    setSpecialization: (catId: string, type: SpecializationType) => void
  ) => {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return;
    
    try {
      const legacyData = JSON.parse(stored) as Array<{
        catId: string;
        specialization: SpecializationType;
        level: number;
        xp: number;
        specializedAt: string;
      }>;
      
      // Apply legacy specializations to cats that don't already have one
      for (const legacy of legacyData) {
        const cat = cats.find(c => c.id === legacy.catId);
        if (cat && !cat.specialization) {
          // Note: This only sets the type, XP/level need to be handled separately
          // For simplicity, we just set the specialization - XP will start fresh
          setSpecialization(legacy.catId, legacy.specialization);
        }
      }
      
      // Clear legacy storage after successful migration
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Silent fail for legacy migration - data will remain in localStorage for retry
    }
  }, []);

  return {
    canSpecialize,
    getSpecialization,
    getActiveBonuses,
    getSpecializedCats,
    migrateLegacyData,
  };
}

// Re-export helper functions for external use
export { getMasteryLevel, getNextMasteryLevel };
