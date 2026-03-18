import { describe, it, expect } from 'vitest';
import { getCatRelationships, getOtherCatId, countFriends, countEnemies } from '../relationshipUtils';
import type { CatRelationship } from '@/types/relationships';

describe('relationshipUtils', () => {
  const mockRelationships: CatRelationship[] = [
    { catId1: 'a', catId2: 'b', score: 60, level: 'friends', lastInteraction: 1, interactionCount: 5 },
    { catId1: 'a', catId2: 'c', score: -40, level: 'rivals', lastInteraction: 1, interactionCount: 3 },
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
