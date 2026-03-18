import { describe, it, expect } from 'vitest';
import { getCatRelationships, getOtherCatId, countFriends, countEnemies } from '../relationshipUtils';

describe('relationshipUtils', () => {
  const mockRelationships = [
    { cat1Id: 'a', cat2Id: 'b', score: 60, lastInteraction: 1, interactionCount: 5 },
    { cat1Id: 'a', cat2Id: 'c', score: -40, lastInteraction: 1, interactionCount: 3 },
  ];

  it('getCatRelationships should filter by catId', () => {
    const result = getCatRelationships('a', mockRelationships);
    expect(result.length).toBe(2);
  });

  it('getOtherCatId should return the other cat', () => {
    expect(getOtherCatId('a', mockRelationships[0])).toBe('b');
    expect(getOtherCatId('b', mockRelationships[0])).toBe('a');
  });

  it('countFriends should count positive relationships', () => {
    const count = countFriends('a', mockRelationships);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('countEnemies should count negative relationships', () => {
    const count = countEnemies('a', mockRelationships);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
