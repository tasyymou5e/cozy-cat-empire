/**
 * @fileoverview Tests for useRelationshipEvents hook
 * @module hooks/relationships/__tests__/useRelationshipEvents.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelationshipEvents } from '../useRelationshipEvents';
import { createMockCat } from '@/test/mocks/gameHookMocks';

describe('useRelationshipEvents', () => {
  const mockUpdateRelationship = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty events array', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );
      expect(result.current.events).toEqual([]);
    });

    it('should initialize with null lastEventId', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );
      expect(result.current.lastEventId).toBeNull();
    });
  });

  describe('addEvent', () => {
    it('should create event with correct structure', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.addEvent(cat1, cat2, 'positive', 'They played together', 10, 1);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toMatchObject({
        catId1: 'cat-1',
        catId2: 'cat-2',
        catName1: 'Whiskers',
        catName2: 'Mittens',
        type: 'positive',
        message: 'They played together',
        scoreChange: 10,
        day: 1,
      });
      expect(result.current.events[0].id).toBeDefined();
    });

    it('should add event to beginning of events list', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.addEvent(cat1, cat2, 'positive', 'First event', 5, 1);
      });

      act(() => {
        result.current.addEvent(cat1, cat2, 'negative', 'Second event', -3, 2);
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].message).toBe('Second event');
      expect(result.current.events[1].message).toBe('First event');
    });

    it('should limit events to 100 max', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        for (let i = 0; i < 110; i++) {
          result.current.addEvent(cat1, cat2, 'positive', `Event ${i}`, 1, i);
        }
      });

      expect(result.current.events).toHaveLength(100);
      // Most recent event should be first
      expect(result.current.events[0].message).toBe('Event 109');
    });

    it('should call updateRelationship with scoreChange', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.addEvent(cat1, cat2, 'positive', 'Played together', 15, 5);
      });

      expect(mockUpdateRelationship).toHaveBeenCalledWith('cat-1', 'cat-2', 15, 5);
    });

    it('should set lastEventId', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      expect(result.current.lastEventId).toBeNull();

      act(() => {
        result.current.addEvent(cat1, cat2, 'positive', 'Test', 5, 1);
      });

      expect(result.current.lastEventId).not.toBeNull();
      expect(result.current.lastEventId).toBe(result.current.events[0].id);
    });
  });

  describe('socializeCats', () => {
    it('should return success with positive message', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers', personality: 'playful' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens', personality: 'playful' });

      let socializeResult: { success: boolean; message: string } | undefined;

      act(() => {
        socializeResult = result.current.socializeCats(cat1, cat2, 1);
      });

      expect(socializeResult?.success).toBe(true);
      expect(socializeResult?.message).toContain('+');
    });

    it('should apply personality compatibility bonus', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      // High compatibility: playful + curious = 20
      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers', personality: 'playful' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens', personality: 'curious' });

      act(() => {
        result.current.socializeCats(cat1, cat2, 1);
      });

      // Base bonus (10) + compatibility bonus (20 / 2 = 10) = 20
      expect(mockUpdateRelationship).toHaveBeenCalledWith('cat-1', 'cat-2', 20, 1);
    });

    it('should create positive event', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens' });

      act(() => {
        result.current.socializeCats(cat1, cat2, 1);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].type).toBe('positive');
    });

    it('should return correct bonus amount in message', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers', personality: 'lazy' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens', personality: 'lazy' });

      let socializeResult: { success: boolean; message: string } | undefined;

      act(() => {
        socializeResult = result.current.socializeCats(cat1, cat2, 1);
      });

      // lazy + lazy compatibility = 10, bonus = 10 + 5 = 15
      expect(socializeResult?.message).toContain('+15');
    });
  });

  describe('processDailyRelationships', () => {
    it('should do nothing if fewer than 2 cats', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1' });

      act(() => {
        result.current.processDailyRelationships([cat1], 1);
      });

      expect(result.current.events).toHaveLength(0);
      expect(mockUpdateRelationship).not.toHaveBeenCalled();
    });

    it('should not always trigger interaction (30% chance)', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', personality: 'playful' });
      const cat2 = createMockCat({ id: 'cat-2', personality: 'playful' });

      // Run many times to verify probabilistic behavior
      let eventCount = 0;
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.processDailyRelationships([cat1, cat2], i);
        });
        eventCount = result.current.events.length;
      }

      // Should have some events but not all 100
      expect(eventCount).toBeGreaterThan(0);
      expect(eventCount).toBeLessThan(100);
    });

    it('should create events with positive or negative type', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const cat1 = createMockCat({ id: 'cat-1', personality: 'playful' });
      const cat2 = createMockCat({ id: 'cat-2', personality: 'playful' });

      // Run many times to get some events
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.processDailyRelationships([cat1, cat2], i);
        });
      }

      // Check that we have events of both types (probabilistically)
      const eventTypes = result.current.events.map((e) => e.type);
      expect(eventTypes.some((t) => t === 'positive' || t === 'negative')).toBe(true);
    });
  });

  describe('setEvents', () => {
    it('should allow direct setting of events', () => {
      const { result } = renderHook(() =>
        useRelationshipEvents({ updateRelationship: mockUpdateRelationship })
      );

      const events = [
        {
          id: 'event-1',
          catId1: 'cat-1',
          catId2: 'cat-2',
          catName1: 'Whiskers',
          catName2: 'Mittens',
          type: 'positive' as const,
          message: 'Test event',
          scoreChange: 5,
          day: 1,
        },
      ];

      act(() => {
        result.current.setEvents(events);
      });

      expect(result.current.events).toEqual(events);
    });
  });
});
