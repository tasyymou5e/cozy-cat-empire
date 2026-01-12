/**
 * @fileoverview Breeding compatibility based on relationships
 * @module hooks/relationships/useRelationshipBreeding
 */

import { useCallback } from 'react';
import { CatRelationship } from '@/types/relationships';

export interface BreedingCompatibility {
  canBreed: boolean;
  bonus: number;
  message: string;
}

interface UseRelationshipBreedingOptions {
  getRelationship: (catId1: string, catId2: string) => CatRelationship | null;
}

/**
 * Breeding compatibility checks based on cat relationships
 */
export function useRelationshipBreeding({ getRelationship }: UseRelationshipBreedingOptions) {
  /**
   * Checks breeding compatibility between two cats
   * 
   * Relationship level affects breeding success:
   * - Best Friends: +20% stat bonus
   * - Friends: +10% health bonus
   * - Neutral: No bonus
   * - Rivals: 50% failure risk
   * - Enemies: Cannot breed at all
   */
  const getBreedingCompatibility = useCallback(
    (cat1Id: string, cat2Id: string): BreedingCompatibility => {
      const rel = getRelationship(cat1Id, cat2Id);
      if (!rel) return { canBreed: true, bonus: 0, message: 'Neutral - no relationship bonus' };

      switch (rel.level) {
        case 'enemy':
          return { canBreed: false, bonus: 0, message: 'Enemies refuse to breed!' };
        case 'rival':
          return { canBreed: true, bonus: -10, message: 'Rivals - 50% breeding failure risk' };
        case 'neutral':
          return { canBreed: true, bonus: 0, message: 'Neutral relationship' };
        case 'friend':
          return { canBreed: true, bonus: 10, message: 'Friends - +10% kitten health' };
        case 'bestFriend':
          return { canBreed: true, bonus: 20, message: 'Best friends - +20% kitten stats!' };
      }
    },
    [getRelationship]
  );

  return {
    getBreedingCompatibility,
  };
}
