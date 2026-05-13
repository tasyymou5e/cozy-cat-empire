import { describe, it, expect } from 'vitest';
import { findOptimalBreedingMatches, calculateBreedingMatch } from '../breedingMatchmaking';

const VALID_TIERS = ['legendary', 'excellent', 'good', 'average', 'poor'] as const;

describe('breedingMatchmaking', () => {
  const makeCat = (id: string, breed: string = 'tabby', grade: number = 5) => ({
    id, name: `Cat ${id}`, type: 'adopted' as const, breed: breed as any,
    health: 100, happiness: 100, hunger: 50, value: 100, age: 1,
    personality: 'playful' as const, showWins: 0, isForSale: false, grade,
    tricksLearned: [] as any[], trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
  });

  it('should return empty array for no cats', () => {
    expect(findOptimalBreedingMatches([], [])).toEqual([]);
  });

  it('should return matches for two cats', () => {
    const cats = [makeCat('c1'), makeCat('c2')];
    const result = findOptimalBreedingMatches(cats, []);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should expose standardized BreedingMatch shape', () => {
    const result = calculateBreedingMatch(makeCat('c1'), makeCat('c2'), []);
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('scores');
    expect(result.scores).toEqual(
      expect.objectContaining({
        genetics: expect.any(Number),
        grades: expect.any(Number),
        relationship: expect.any(Number),
        personality: expect.any(Number),
        health: expect.any(Number),
      })
    );
    expect(typeof result.overallScore).toBe('number');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(VALID_TIERS).toContain(result.tier);
  });

  it('returned matches are sorted by overallScore descending', () => {
    const cats = [makeCat('a', 'tabby', 10), makeCat('b', 'persian', 8), makeCat('c', 'bengal', 6)];
    const matches = findOptimalBreedingMatches(cats, []);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].overallScore).toBeGreaterThanOrEqual(matches[i].overallScore);
    }
  });
});
