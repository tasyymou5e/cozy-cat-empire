/**
 * @fileoverview Tests for useRelationshipCore hook
 * @module hooks/relationships/__tests__/useRelationshipCore.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelationshipCore } from '../useRelationshipCore';
import { CatRelationship } from '@/types/relationships';

describe('useRelationshipCore', () => {
  describe('initial state', () => {
    it('should initialize with empty relationships array', () => {
      const { result } = renderHook(() => useRelationshipCore());
      expect(result.current.relationships).toEqual([]);
    });
  });

  describe('getRelationship', () => {
    it('should return null for non-existent relationship', () => {
      const { result } = renderHook(() => useRelationshipCore());
      expect(result.current.getRelationship('cat-1', 'cat-2')).toBeNull();
    });

    it('should find relationship by catId1/catId2', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 30, 1);
      });

      const rel = result.current.getRelationship('cat-1', 'cat-2');
      expect(rel).not.toBeNull();
      expect(rel?.score).toBe(30);
    });

    it('should find relationship by catId2/catId1 (reversed order)', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 30, 1);
      });

      // Search in reverse order
      const rel = result.current.getRelationship('cat-2', 'cat-1');
      expect(rel).not.toBeNull();
      expect(rel?.score).toBe(30);
    });
  });

  describe('updateRelationship', () => {
    it('should create new relationship if none exists', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 25, 1);
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0]).toMatchObject({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: 25,
        level: 'friend',
        lastInteraction: 1,
      });
    });

    it('should update existing relationship score', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 20, 1);
      });

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 15, 2);
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].score).toBe(35);
      expect(result.current.relationships[0].lastInteraction).toBe(2);
    });

    it('should clamp score to -100 minimum', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', -150, 1);
      });

      expect(result.current.relationships[0].score).toBe(-100);
      expect(result.current.relationships[0].level).toBe('enemy');
    });

    it('should clamp score to +100 maximum', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 150, 1);
      });

      expect(result.current.relationships[0].score).toBe(100);
      expect(result.current.relationships[0].level).toBe('bestFriend');
    });

    it('should update relationship level based on new score', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 15, 1);
      });
      expect(result.current.relationships[0].level).toBe('neutral');

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 10, 2);
      });
      expect(result.current.relationships[0].level).toBe('friend');
    });

    it('should update lastInteraction to current day', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 10, 5);
      });

      expect(result.current.relationships[0].lastInteraction).toBe(5);

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 5, 10);
      });

      expect(result.current.relationships[0].lastInteraction).toBe(10);
    });
  });

  describe('removeCatRelationships', () => {
    it('should remove all relationships for a cat', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 30, 1);
        result.current.updateRelationship('cat-1', 'cat-3', 20, 1);
        result.current.updateRelationship('cat-2', 'cat-3', 10, 1);
      });

      expect(result.current.relationships).toHaveLength(3);

      act(() => {
        result.current.removeCatRelationships('cat-1');
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].catId1).toBe('cat-2');
      expect(result.current.relationships[0].catId2).toBe('cat-3');
    });

    it('should not affect relationships of other cats', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 30, 1);
        result.current.updateRelationship('cat-3', 'cat-4', 20, 1);
      });

      act(() => {
        result.current.removeCatRelationships('cat-1');
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].catId1).toBe('cat-3');
    });
  });

  describe('getHappinessModifier', () => {
    it('should return 0 for cat with no relationships', () => {
      const { result } = renderHook(() => useRelationshipCore());
      expect(result.current.getHappinessModifier('cat-1')).toBe(0);
    });

    it('should return +5 for each bestFriend', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.setRelationships([
          { catId1: 'cat-1', catId2: 'cat-2', score: 80, level: 'bestFriend', lastInteraction: 1 },
        ]);
      });

      expect(result.current.getHappinessModifier('cat-1')).toBe(5);
    });

    it('should return +2 for each friend', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.setRelationships([
          { catId1: 'cat-1', catId2: 'cat-2', score: 40, level: 'friend', lastInteraction: 1 },
        ]);
      });

      expect(result.current.getHappinessModifier('cat-1')).toBe(2);
    });

    it('should return -2 for each rival', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.setRelationships([
          { catId1: 'cat-1', catId2: 'cat-2', score: -30, level: 'rival', lastInteraction: 1 },
        ]);
      });

      expect(result.current.getHappinessModifier('cat-1')).toBe(-2);
    });

    it('should return -5 for each enemy', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.setRelationships([
          { catId1: 'cat-1', catId2: 'cat-2', score: -80, level: 'enemy', lastInteraction: 1 },
        ]);
      });

      expect(result.current.getHappinessModifier('cat-1')).toBe(-5);
    });

    it('should sum modifiers from multiple relationships', () => {
      const { result } = renderHook(() => useRelationshipCore());

      act(() => {
        result.current.setRelationships([
          { catId1: 'cat-1', catId2: 'cat-2', score: 80, level: 'bestFriend', lastInteraction: 1 },
          { catId1: 'cat-1', catId2: 'cat-3', score: 40, level: 'friend', lastInteraction: 1 },
          { catId1: 'cat-4', catId2: 'cat-1', score: -30, level: 'rival', lastInteraction: 1 },
        ]);
      });

      // bestFriend (+5) + friend (+2) + rival (-2) = 5
      expect(result.current.getHappinessModifier('cat-1')).toBe(5);
    });
  });

  describe('setRelationships', () => {
    it('should allow direct setting of relationships', () => {
      const { result } = renderHook(() => useRelationshipCore());

      const relationships: CatRelationship[] = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      act(() => {
        result.current.setRelationships(relationships);
      });

      expect(result.current.relationships).toEqual(relationships);
    });
  });
});
