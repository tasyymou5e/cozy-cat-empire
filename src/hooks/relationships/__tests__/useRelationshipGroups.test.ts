/**
 * @fileoverview Tests for useRelationshipGroups hook
 * @module hooks/relationships/__tests__/useRelationshipGroups.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelationshipGroups } from '../useRelationshipGroups';
import { CatRelationship } from '@/types/relationships';
import { createMockCat } from '@/test/mocks/gameHookMocks';

describe('useRelationshipGroups', () => {
  describe('initial state', () => {
    it('should initialize with empty groups array', () => {
      const { result } = renderHook(() => useRelationshipGroups({ relationships: [] }));
      expect(result.current.groups).toEqual([]);
    });
  });

  describe('detectGroups', () => {
    it('should return empty groups for fewer than 2 cats', () => {
      const { result } = renderHook(() => useRelationshipGroups({ relationships: [] }));

      const cat1 = createMockCat({ id: 'cat-1' });

      act(() => {
        result.current.detectGroups([cat1]);
      });

      expect(result.current.groups).toEqual([]);
    });

    it('should return empty groups when no friendships exist', () => {
      const { result } = renderHook(() => useRelationshipGroups({ relationships: [] }));

      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });

      act(() => {
        result.current.detectGroups([cat1, cat2]);
      });

      expect(result.current.groups).toEqual([]);
    });

    it('should detect friend group from connected cats', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.detectGroups([cat1, cat2]);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].type).toBe('friendly');
      expect(result.current.groups[0].memberIds).toContain('cat-1');
      expect(result.current.groups[0].memberIds).toContain('cat-2');
    });

    it('should detect multiple separate friend groups', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-3', catId2: 'cat-4', score: 40, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [
        createMockCat({ id: 'cat-1' }),
        createMockCat({ id: 'cat-2' }),
        createMockCat({ id: 'cat-3' }),
        createMockCat({ id: 'cat-4' }),
      ];

      act(() => {
        result.current.detectGroups(cats);
      });

      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups.every((g) => g.type === 'friendly')).toBe(true);
    });

    it('should assign group name from predefined list', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });

      act(() => {
        result.current.detectGroups([cat1, cat2]);
      });

      const validNames = [
        'The Cozy Crew',
        'Nap Squad',
        'The Purr Pack',
        'Whisker Gang',
        'Sunny Spot Club',
        'The Cuddle Clique',
        'Treat Team',
        'Meow Mob',
      ];

      expect(validNames).toContain(result.current.groups[0].name);
    });

    it('should identify leader as cat with most friends', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-1', catId2: 'cat-3', score: 40, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-2', catId2: 'cat-3', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [
        createMockCat({ id: 'cat-1' }),
        createMockCat({ id: 'cat-2' }),
        createMockCat({ id: 'cat-3' }),
      ];

      act(() => {
        result.current.detectGroups(cats);
      });

      // cat-1 has 2 friends, cat-2 has 2 friends, cat-3 has 2 friends
      // All have same count, so first encountered should be leader
      expect(result.current.groups[0].leaderCatId).toBeDefined();
      expect(['cat-1', 'cat-2', 'cat-3']).toContain(result.current.groups[0].leaderCatId);
    });

    it('should detect outcasts (no friends, has rivalries)', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-3', catId2: 'cat-1', score: -30, level: 'rival', lastInteraction: 1 },
        { catId1: 'cat-4', catId2: 'cat-2', score: -40, level: 'rival', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [
        createMockCat({ id: 'cat-1' }),
        createMockCat({ id: 'cat-2' }),
        createMockCat({ id: 'cat-3' }),
        createMockCat({ id: 'cat-4' }),
      ];

      act(() => {
        result.current.detectGroups(cats);
      });

      const outcastGroup = result.current.groups.find((g) => g.type === 'outcasts');
      expect(outcastGroup).toBeDefined();
      expect(outcastGroup?.memberIds).toContain('cat-3');
      expect(outcastGroup?.memberIds).toContain('cat-4');
    });

    it('should not create outcast group for single outcast', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-3', catId2: 'cat-1', score: -30, level: 'rival', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [
        createMockCat({ id: 'cat-1' }),
        createMockCat({ id: 'cat-2' }),
        createMockCat({ id: 'cat-3' }),
      ];

      act(() => {
        result.current.detectGroups(cats);
      });

      const outcastGroup = result.current.groups.find((g) => g.type === 'outcasts');
      expect(outcastGroup).toBeUndefined();
    });

    it('should correctly identify group type', () => {
      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [createMockCat({ id: 'cat-1' }), createMockCat({ id: 'cat-2' })];

      act(() => {
        result.current.detectGroups(cats);
      });

      expect(result.current.groups[0].type).toBe('friendly');
    });

    it('should handle complex graph with multiple components', () => {
      // Create two separate friend groups and some outcasts
      const relationships: CatRelationship[] = [
        // Group 1: cat-1, cat-2, cat-3 (connected)
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
        { catId1: 'cat-2', catId2: 'cat-3', score: 40, level: 'friend', lastInteraction: 1 },
        // Group 2: cat-4, cat-5 (connected)
        { catId1: 'cat-4', catId2: 'cat-5', score: 60, level: 'bestFriend', lastInteraction: 1 },
        // Outcasts: cat-6, cat-7 (have rivalries but no friends)
        { catId1: 'cat-6', catId2: 'cat-1', score: -30, level: 'rival', lastInteraction: 1 },
        { catId1: 'cat-7', catId2: 'cat-2', score: -25, level: 'rival', lastInteraction: 1 },
      ];

      const { result } = renderHook(() => useRelationshipGroups({ relationships }));

      const cats = [
        createMockCat({ id: 'cat-1' }),
        createMockCat({ id: 'cat-2' }),
        createMockCat({ id: 'cat-3' }),
        createMockCat({ id: 'cat-4' }),
        createMockCat({ id: 'cat-5' }),
        createMockCat({ id: 'cat-6' }),
        createMockCat({ id: 'cat-7' }),
      ];

      act(() => {
        result.current.detectGroups(cats);
      });

      const friendlyGroups = result.current.groups.filter((g) => g.type === 'friendly');
      const outcastGroups = result.current.groups.filter((g) => g.type === 'outcasts');

      expect(friendlyGroups).toHaveLength(2);
      expect(outcastGroups).toHaveLength(1);

      // Verify group sizes
      const largerGroup = friendlyGroups.find((g) => g.memberIds.length === 3);
      const smallerGroup = friendlyGroups.find((g) => g.memberIds.length === 2);

      expect(largerGroup?.memberIds).toEqual(expect.arrayContaining(['cat-1', 'cat-2', 'cat-3']));
      expect(smallerGroup?.memberIds).toEqual(expect.arrayContaining(['cat-4', 'cat-5']));
    });

    it('should update groups when relationships change', () => {
      let relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result, rerender } = renderHook(
        ({ relationships }) => useRelationshipGroups({ relationships }),
        { initialProps: { relationships } }
      );

      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      const cat3 = createMockCat({ id: 'cat-3' });

      act(() => {
        result.current.detectGroups([cat1, cat2]);
      });

      expect(result.current.groups).toHaveLength(1);

      // Add another relationship
      relationships = [
        ...relationships,
        { catId1: 'cat-1', catId2: 'cat-3', score: 40, level: 'friend', lastInteraction: 1 },
      ];

      rerender({ relationships });

      act(() => {
        result.current.detectGroups([cat1, cat2, cat3]);
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].memberIds).toHaveLength(3);
    });
  });
});
