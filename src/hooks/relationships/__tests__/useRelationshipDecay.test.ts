/**
 * @fileoverview Tests for useRelationshipDecay hook
 * @module hooks/relationships/__tests__/useRelationshipDecay.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelationshipDecay } from '../useRelationshipDecay';
import { CatRelationship, RelationshipEvent, RELATIONSHIP_DECAY } from '@/types/relationships';
import { createMockCat } from '@/test/mocks/gameHookMocks';

describe('useRelationshipDecay', () => {
  let relationships: CatRelationship[];
  let events: RelationshipEvent[];
  let setRelationships: React.Dispatch<React.SetStateAction<CatRelationship[]>>;
  let setEvents: React.Dispatch<React.SetStateAction<RelationshipEvent[]>>;
  let setLastEventId: (id: string) => void;

  beforeEach(() => {
    relationships = [];
    events = [];
    setRelationships = vi.fn().mockImplementation((updater) => {
      if (typeof updater === 'function') {
        relationships = updater(relationships);
      } else {
        relationships = updater;
      }
    });
    setEvents = vi.fn().mockImplementation((updater) => {
      if (typeof updater === 'function') {
        events = updater(events);
      } else {
        events = updater;
      }
    });
    setLastEventId = vi.fn();
  });

  describe('initial state', () => {
    it('should initialize with zero maintenance streak', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );
      expect(result.current.maintenanceStreak).toBe(0);
    });

    it('should initialize with zero longest maintenance streak', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );
      expect(result.current.longestMaintenanceStreak).toBe(0);
    });

    it('should initialize with null lastMaintenanceDay', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );
      expect(result.current.lastMaintenanceDay).toBeNull();
    });
  });

  describe('processRelationshipDecay', () => {
    it('should not decay relationships within grace period', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 8 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      // Day 10, last interaction day 8 = 2 days (within 3-day grace period)
      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 10);
      });

      expect(setRelationships).toHaveBeenCalled();
      // Score should remain unchanged
      expect(relationships[0].score).toBe(50);
    });

    it('should apply light decay (1 point) after 3 days', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      // Day 5, last interaction day 1 = 4 days (light decay zone: 3-4 days)
      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 5);
      });

      expect(relationships[0].score).toBe(50 - RELATIONSHIP_DECAY.LIGHT_DECAY);
    });

    it('should apply moderate decay (2 points) after 5 days', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      // Day 7, last interaction day 1 = 6 days (moderate decay zone: 5-6 days)
      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 7);
      });

      expect(relationships[0].score).toBe(50 - RELATIONSHIP_DECAY.MODERATE_DECAY);
    });

    it('should apply severe decay (3 points) after 7 days', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 50, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      // Day 10, last interaction day 1 = 9 days (severe decay zone: 7+ days)
      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 10);
      });

      expect(relationships[0].score).toBe(50 - RELATIONSHIP_DECAY.SEVERE_DECAY);
    });

    it('should not decay below MIN_DECAY_SCORE (-20)', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: -19, level: 'rival', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 10);
      });

      expect(relationships[0].score).toBe(RELATIONSHIP_DECAY.MIN_DECAY_SCORE);
    });

    it('should update relationship level when crossing threshold', () => {
      // Score of 21 is 'friend', after decay should become 'neutral' (threshold is 20)
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 21, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      // Severe decay (-3) should bring score to 18, which is 'neutral'
      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 10);
      });

      expect(relationships[0].level).toBe('neutral');
    });

    it('should create decay event when level changes', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 21, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.processRelationshipDecay([cat1, cat2], 10);
      });

      expect(setEvents).toHaveBeenCalled();
      expect(setLastEventId).toHaveBeenCalled();
    });
  });

  describe('checkMaintenanceStreak', () => {
    it('should not start streak with no friendships', () => {
      relationships = [];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      expect(result.current.maintenanceStreak).toBe(0);
    });

    it('should start streak of 1 when all friendships maintained', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      // Day 2, friendship maintained (last interaction day 1, within grace period)
      act(() => {
        result.current.checkMaintenanceStreak(2);
      });

      expect(result.current.maintenanceStreak).toBe(1);
    });

    it('should increment streak on consecutive days', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      // Update lastInteraction to keep within grace period
      relationships[0].lastInteraction = 2;

      act(() => {
        result.current.checkMaintenanceStreak(2);
      });

      expect(result.current.maintenanceStreak).toBe(2);
    });

    it('should reset streak when a friendship decays', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      // Start a streak
      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      expect(result.current.maintenanceStreak).toBe(1);

      // Friendship now decaying (day 10, last interaction day 1 = 9 days)
      act(() => {
        result.current.checkMaintenanceStreak(10);
      });

      expect(result.current.maintenanceStreak).toBe(0);
    });

    it('should track longestMaintenanceStreak', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      // Build a streak of 3
      for (let day = 1; day <= 3; day++) {
        relationships[0].lastInteraction = day;
        act(() => {
          result.current.checkMaintenanceStreak(day);
        });
      }

      expect(result.current.longestMaintenanceStreak).toBe(3);

      // Reset streak
      act(() => {
        result.current.checkMaintenanceStreak(15);
      });

      // Longest should still be 3
      expect(result.current.longestMaintenanceStreak).toBe(3);
      expect(result.current.maintenanceStreak).toBe(0);
    });

    it('should not double-count same day', () => {
      relationships = [
        { catId1: 'cat-1', catId2: 'cat-2', score: 30, level: 'friend', lastInteraction: 1 },
      ];

      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      expect(result.current.maintenanceStreak).toBe(1);

      // Check same day again
      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      // Should still be 1
      expect(result.current.maintenanceStreak).toBe(1);
    });
  });

  describe('state setters', () => {
    it('should allow setting maintenanceStreak', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.setMaintenanceStreak(5);
      });

      expect(result.current.maintenanceStreak).toBe(5);
    });

    it('should allow setting longestMaintenanceStreak', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.setLongestMaintenanceStreak(10);
      });

      expect(result.current.longestMaintenanceStreak).toBe(10);
    });

    it('should allow setting lastMaintenanceDay', () => {
      const { result } = renderHook(() =>
        useRelationshipDecay({
          relationships,
          setRelationships,
          setEvents,
          setLastEventId,
        })
      );

      act(() => {
        result.current.setLastMaintenanceDay(7);
      });

      expect(result.current.lastMaintenanceDay).toBe(7);
    });
  });
});
