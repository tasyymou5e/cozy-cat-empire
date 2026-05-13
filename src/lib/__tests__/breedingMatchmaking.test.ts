import { describe, it, expect } from 'vitest';
import { findOptimalBreedingMatches, calculateBreedingMatch } from '../breedingMatchmaking';

describe('breedingMatchmaking', () => {
  const makeCat = (id: string, breed: string = 'tabby', grade: number = 5) => ({
    id, name: `Cat ${id}`, type: 'adopted' as const, breed: breed as any,
    health: 100, happiness: 100, hunger: 50, value: 100, age: 1,
    personality: 'playful' as const, showWins: 0, isForSale: false, grade,
    tricksLearned: [] as any[], trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
  });

  it('should return empty array for no cats', () => {
    const result = findOptimalBreedingMatches([], []);
    expect(result).toEqual([]);
  });

  it('should return matches for two cats', () => {
    const cats = [makeCat('c1'), makeCat('c2')];
    const result = findOptimalBreedingMatches(cats, []);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should calculate match between two cats', () => {
    const result = calculateBreedingMatch(makeCat('c1'), makeCat('c2'), []);
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('tier');
  });
});
