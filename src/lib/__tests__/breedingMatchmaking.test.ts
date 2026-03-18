import { describe, it, expect } from 'vitest';
import { getBreedingRecommendations } from '../breedingMatchmaking';

describe('breedingMatchmaking', () => {
  it('should return empty array for no cats', () => {
    const result = getBreedingRecommendations([], []);
    expect(result).toEqual([]);
  });

  it('should return empty array for single cat', () => {
    const cats = [{
      id: 'c1', name: 'Test', type: 'adopted' as const, breed: 'tabby' as const,
      health: 100, happiness: 100, hunger: 50, value: 100, age: 1,
      personality: 'playful' as const, showWins: 0, isForSale: false, grade: 5,
      tricksLearned: [], trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
      restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
    }];
    const result = getBreedingRecommendations(cats, []);
    expect(Array.isArray(result)).toBe(true);
  });
});
