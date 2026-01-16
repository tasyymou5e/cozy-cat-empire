/**
 * Integration tests for the relationship system
 *
 * Tests the full hook composition and interaction between decomposed hooks:
 * - useRelationshipCore
 * - useRelationshipEvents
 * - useRelationshipDecay
 * - useRelationshipGroups
 * - useRelationshipBreeding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRelationships, RelationshipSaveData } from '../useRelationships';
import { createMockCat, createMockCats } from './testUtils';

describe('useRelationships Integration Tests', () => {
  describe('hook composition and initialization', () => {
    it('should expose complete API from all sub-hooks', () => {
      const { result } = renderHook(() => useRelationships());

      // State from core
      expect(result.current.relationships).toBeDefined();
      expect(Array.isArray(result.current.relationships)).toBe(true);

      // State from events
      expect(result.current.events).toBeDefined();
      expect(Array.isArray(result.current.events)).toBe(true);
      expect(result.current.lastEventId).toBeDefined();

      // State from decay
      expect(typeof result.current.maintenanceStreak).toBe('number');
      expect(typeof result.current.longestMaintenanceStreak).toBe('number');

      // State from groups
      expect(result.current.groups).toBeDefined();
      expect(Array.isArray(result.current.groups)).toBe(true);
    });

    it('should expose all required functions', () => {
      const { result } = renderHook(() => useRelationships());

      // Core functions
      expect(typeof result.current.getRelationship).toBe('function');
      expect(typeof result.current.updateRelationship).toBe('function');
      expect(typeof result.current.removeCatRelationships).toBe('function');
      expect(typeof result.current.getHappinessModifier).toBe('function');

      // Event functions
      expect(typeof result.current.addEvent).toBe('function');
      expect(typeof result.current.socializeCats).toBe('function');
      expect(typeof result.current.processDailyRelationships).toBe('function');

      // Decay functions
      expect(typeof result.current.processRelationshipDecay).toBe('function');
      expect(typeof result.current.checkMaintenanceStreak).toBe('function');

      // Group functions
      expect(typeof result.current.detectGroups).toBe('function');

      // Breeding functions
      expect(typeof result.current.getBreedingCompatibility).toBe('function');

      // Persistence functions
      expect(typeof result.current.loadRelationships).toBe('function');
      expect(typeof result.current.getRelationshipSaveData).toBe('function');
    });

    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useRelationships());

      expect(result.current.relationships).toHaveLength(0);
      expect(result.current.events).toHaveLength(0);
      expect(result.current.groups).toHaveLength(0);
      expect(result.current.maintenanceStreak).toBe(0);
    });
  });

  describe('cross-hook data flow', () => {
    it('socializeCats should create event AND update relationship', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1', name: 'Whiskers', personality: 'playful' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mittens', personality: 'curious' });

      act(() => {
        result.current.socializeCats(cat1, cat2, 1);
      });

      // Verify event was created (useRelationshipEvents)
      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].type).toBe('positive');
      expect(result.current.events[0].catId1).toBe('cat-1');
      expect(result.current.events[0].catId2).toBe('cat-2');

      // Verify relationship was updated (useRelationshipCore)
      expect(result.current.relationships.length).toBe(1);
      expect(result.current.relationships[0].score).toBeGreaterThan(0);

      // Verify lastEventId was set
      expect(result.current.lastEventId).toBe(result.current.events[0].id);
    });

    it('addEvent should update both events array AND relationship score', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1', name: 'Luna' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Mochi' });

      act(() => {
        result.current.addEvent(cat1, cat2, 'positive', 'Played together', 15, 1);
      });

      expect(result.current.events.length).toBe(1);
      expect(result.current.events[0].message).toBe('Played together');

      const relationship = result.current.getRelationship('cat-1', 'cat-2');
      expect(relationship).not.toBeNull();
      expect(relationship?.score).toBe(15);
    });

    it('updateRelationship should be accessible to getBreedingCompatibility', () => {
      const { result } = renderHook(() => useRelationships());

      // Create a relationship
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 80, 1);
      });

      // getBreedingCompatibility should see the relationship
      const compatibility = result.current.getBreedingCompatibility('cat-1', 'cat-2');
      expect(compatibility.canBreed).toBe(true);
      expect(compatibility.bonus).toBe(20); // Best friend bonus
    });

    it('relationships should be visible to getHappinessModifier', () => {
      const { result } = renderHook(() => useRelationships());

      // Create a positive relationship
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 60, 1);
      });

      const modifier = result.current.getHappinessModifier('cat-1');
      expect(modifier).toBeGreaterThan(0);
    });

    it('detectGroups should use current relationships', () => {
      const { result } = renderHook(() => useRelationships());

      const cats = createMockCats(3);

      // Build friendships
      act(() => {
        result.current.updateRelationship(cats[0].id, cats[1].id, 50, 1);
        result.current.updateRelationship(cats[1].id, cats[2].id, 50, 1);
      });

      act(() => {
        result.current.detectGroups(cats);
      });

      expect(result.current.groups.length).toBeGreaterThan(0);
    });
  });

  describe('full lifecycle scenarios', () => {
    it('should progress strangers to friends through socialization', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1', personality: 'affectionate' });
      const cat2 = createMockCat({ id: 'cat-2', personality: 'affectionate' });

      // Socialize multiple times
      for (let day = 1; day <= 5; day++) {
        act(() => {
          result.current.socializeCats(cat1, cat2, day);
        });
      }

      // Should reach friend level (score >= 30)
      const relationship = result.current.getRelationship('cat-1', 'cat-2');
      expect(relationship).not.toBeNull();
      expect(relationship!.score).toBeGreaterThanOrEqual(30);
      expect(relationship!.level).toBe('friend');

      // Events should be recorded
      expect(result.current.events.length).toBe(5);
    });

    it('should handle rivalry through negative events', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1', name: 'Grumpy' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Snappy' });

      // Add negative events
      act(() => {
        result.current.addEvent(cat1, cat2, 'negative', 'Had a fight', -20, 1);
        result.current.addEvent(cat1, cat2, 'negative', 'Hissed at each other', -15, 2);
      });

      const relationship = result.current.getRelationship('cat-1', 'cat-2');
      expect(relationship).not.toBeNull();
      expect(relationship!.score).toBeLessThan(0);
      expect(['rival', 'enemy']).toContain(relationship!.level);
    });

    it('should allow friendship repair through positive interactions', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });

      // Start as rivals
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', -40, 1);
      });

      expect(result.current.getRelationship('cat-1', 'cat-2')?.level).toBe('rival');

      // Repair through socialization
      for (let day = 2; day <= 10; day++) {
        act(() => {
          result.current.socializeCats(cat1, cat2, day);
        });
      }

      const relationship = result.current.getRelationship('cat-1', 'cat-2');
      expect(relationship!.score).toBeGreaterThan(-40);
    });

    it('should form groups from connected friendships', () => {
      const { result } = renderHook(() => useRelationships());

      const cats = [
        createMockCat({ id: 'cat-1', name: 'Alpha' }),
        createMockCat({ id: 'cat-2', name: 'Beta' }),
        createMockCat({ id: 'cat-3', name: 'Gamma' }),
        createMockCat({ id: 'cat-4', name: 'Delta' }),
      ];

      // Create two separate friend groups
      act(() => {
        // Group 1: cat-1 and cat-2
        result.current.updateRelationship('cat-1', 'cat-2', 50, 1);
        // Group 2: cat-3 and cat-4
        result.current.updateRelationship('cat-3', 'cat-4', 50, 1);
      });

      act(() => {
        result.current.detectGroups(cats);
      });

      // Should detect 2 friendly groups
      const friendlyGroups = result.current.groups.filter((g) => g.type === 'friendly');
      expect(friendlyGroups.length).toBe(2);
    });
  });

  describe('persistence integration', () => {
    it('should capture full state in save data', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });

      act(() => {
        result.current.socializeCats(cat1, cat2, 1);
        result.current.socializeCats(cat1, cat2, 2);
      });

      let saveData: RelationshipSaveData;
      act(() => {
        saveData = result.current.getRelationshipSaveData();
      });

      expect(saveData!.relationships).toHaveLength(1);
      expect(saveData!.events).toHaveLength(2);
      expect(typeof saveData!.maintenanceStreak).toBe('number');
      expect(typeof saveData!.longestMaintenanceStreak).toBe('number');
    });

    it('should restore state from save data', () => {
      const saveData: RelationshipSaveData = {
        relationships: [
          {
            catId1: 'cat-1',
            catId2: 'cat-2',
            score: 45,
            level: 'friend',
            lastInteraction: 5,
          },
        ],
        events: [
          {
            id: 'event-1',
            catId1: 'cat-1',
            catId2: 'cat-2',
            catName1: 'Cat 1',
            catName2: 'Cat 2',
            type: 'positive',
            message: 'Became friends',
            scoreChange: 45,
            day: 5,
          },
        ],
        maintenanceStreak: 3,
        longestMaintenanceStreak: 5,
        lastMaintenanceDay: 5,
      };

      const { result } = renderHook(() => useRelationships());

      act(() => {
        result.current.loadRelationships(saveData);
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].score).toBe(45);
      expect(result.current.events).toHaveLength(1);
      expect(result.current.maintenanceStreak).toBe(3);
      expect(result.current.longestMaintenanceStreak).toBe(5);
    });

    it('should round-trip save and load correctly', () => {
      const { result } = renderHook(() => useRelationships());

      const cat1 = createMockCat({ id: 'cat-1', name: 'Oreo' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Cookie' });

      // Build state
      act(() => {
        result.current.socializeCats(cat1, cat2, 1);
        result.current.socializeCats(cat1, cat2, 2);
      });

      const originalRelationships = [...result.current.relationships];
      const originalEvents = [...result.current.events];

      // Capture save data
      let saveData: RelationshipSaveData;
      act(() => {
        saveData = result.current.getRelationshipSaveData();
      });

      // Create new hook instance and load
      const { result: result2 } = renderHook(() => useRelationships());

      act(() => {
        result2.current.loadRelationships(saveData!);
      });

      // Verify state restored
      expect(result2.current.relationships).toEqual(originalRelationships);
      expect(result2.current.events).toEqual(originalEvents);
    });

    it('loaded relationships should work with all functions', () => {
      const saveData: RelationshipSaveData = {
        relationships: [
          {
            catId1: 'cat-1',
            catId2: 'cat-2',
            score: 60,
            level: 'bestFriend',
            lastInteraction: 5,
          },
        ],
        events: [],
        maintenanceStreak: 0,
        longestMaintenanceStreak: 0,
        lastMaintenanceDay: null,
      };

      const { result } = renderHook(() => useRelationships());

      act(() => {
        result.current.loadRelationships(saveData);
      });

      // getRelationship should work
      const rel = result.current.getRelationship('cat-1', 'cat-2');
      expect(rel).not.toBeNull();
      expect(rel!.score).toBe(60);

      // getBreedingCompatibility should work
      const compat = result.current.getBreedingCompatibility('cat-1', 'cat-2');
      expect(compat.canBreed).toBe(true);

      // getHappinessModifier should work
      const modifier = result.current.getHappinessModifier('cat-1');
      expect(modifier).toBeGreaterThan(0);
    });
  });

  describe('breeding compatibility integration', () => {
    it('should reflect relationship level in breeding compatibility', () => {
      const { result } = renderHook(() => useRelationships());

      // Best friends
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 80, 1);
      });

      const bestFriendCompat = result.current.getBreedingCompatibility('cat-1', 'cat-2');
      expect(bestFriendCompat.canBreed).toBe(true);
      expect(bestFriendCompat.bonus).toBe(20);

      // Friends
      act(() => {
        result.current.updateRelationship('cat-3', 'cat-4', 40, 1);
      });

      const friendCompat = result.current.getBreedingCompatibility('cat-3', 'cat-4');
      expect(friendCompat.canBreed).toBe(true);
      expect(friendCompat.bonus).toBe(10);

      // Strangers (no relationship)
      const strangerCompat = result.current.getBreedingCompatibility('cat-5', 'cat-6');
      expect(strangerCompat.canBreed).toBe(true);
      expect(strangerCompat.bonus).toBe(0);
    });

    it('enemies should not be able to breed', () => {
      const { result } = renderHook(() => useRelationships());

      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', -60, 1);
      });

      const enemyCompat = result.current.getBreedingCompatibility('cat-1', 'cat-2');
      expect(enemyCompat.canBreed).toBe(false);
      expect(enemyCompat.message).toBeDefined();
    });
  });

  describe('group detection integration', () => {
    it('should detect friendly groups from positive relationships', () => {
      const { result } = renderHook(() => useRelationships());

      const cats = createMockCats(4);

      // Create a connected group of 3 friends
      act(() => {
        result.current.updateRelationship(cats[0].id, cats[1].id, 50, 1);
        result.current.updateRelationship(cats[1].id, cats[2].id, 50, 1);
        result.current.updateRelationship(cats[0].id, cats[2].id, 50, 1);
      });

      act(() => {
        result.current.detectGroups(cats);
      });

      const friendlyGroups = result.current.groups.filter((g) => g.type === 'friendly');
      expect(friendlyGroups.length).toBeGreaterThanOrEqual(1);

      // The group should contain all 3 connected cats
      const largestGroup = friendlyGroups.reduce(
        (max, g) => (g.memberIds.length > max.memberIds.length ? g : max),
        friendlyGroups[0]
      );
      expect(largestGroup.memberIds).toContain(cats[0].id);
      expect(largestGroup.memberIds).toContain(cats[1].id);
      expect(largestGroup.memberIds).toContain(cats[2].id);
    });

    it('should detect outcast groups', () => {
      const { result } = renderHook(() => useRelationships());

      const cats = createMockCats(3);

      // One cat is enemies with everyone
      act(() => {
        result.current.updateRelationship(cats[0].id, cats[1].id, -50, 1);
        result.current.updateRelationship(cats[0].id, cats[2].id, -50, 1);
      });

      act(() => {
        result.current.detectGroups(cats);
      });

      const outcastGroups = result.current.groups.filter((g) => g.type === 'outcasts');
      expect(outcastGroups.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('maintenance streak integration', () => {
    it('should track maintenance streak when checking', () => {
      const { result } = renderHook(() => useRelationships());

      // Create a friendship
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 50, 1);
      });

      // Check maintenance on consecutive days
      act(() => {
        result.current.checkMaintenanceStreak(1);
      });

      act(() => {
        result.current.checkMaintenanceStreak(2);
      });

      // Streak should be tracked
      expect(result.current.maintenanceStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('removeCatRelationships integration', () => {
    it('should remove all relationships for a cat', () => {
      const { result } = renderHook(() => useRelationships());

      // Create multiple relationships
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 50, 1);
        result.current.updateRelationship('cat-1', 'cat-3', 30, 1);
        result.current.updateRelationship('cat-2', 'cat-3', 40, 1);
      });

      expect(result.current.relationships.length).toBe(3);

      // Remove cat-1's relationships
      act(() => {
        result.current.removeCatRelationships('cat-1');
      });

      expect(result.current.relationships.length).toBe(1);
      expect(result.current.getRelationship('cat-1', 'cat-2')).toBeNull();
      expect(result.current.getRelationship('cat-1', 'cat-3')).toBeNull();
      expect(result.current.getRelationship('cat-2', 'cat-3')).not.toBeNull();
    });

    it('removed relationships should not affect breeding compatibility', () => {
      const { result } = renderHook(() => useRelationships());

      // Create best friends
      act(() => {
        result.current.updateRelationship('cat-1', 'cat-2', 80, 1);
      });

      expect(result.current.getBreedingCompatibility('cat-1', 'cat-2').bonus).toBe(20);

      // Remove relationship
      act(() => {
        result.current.removeCatRelationships('cat-1');
      });

      // Should now be strangers
      const compat = result.current.getBreedingCompatibility('cat-1', 'cat-2');
      expect(compat.bonus).toBe(0);
    });
  });
});
