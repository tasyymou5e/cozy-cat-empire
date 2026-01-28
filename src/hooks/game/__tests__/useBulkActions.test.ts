/**
 * @fileoverview Tests for useBulkActions hook
 *
 * Tests bulk operations: heal all, rest all, comfort all, train all, sell selected.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkActions } from '../useBulkActions';
import {
  createMockDependencies,
  createMockCat,
  createMockResources,
} from '@/test/mocks/gameHookMocks';

describe('useBulkActions', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('healAllSickCats', () => {
    it('should heal all cats with health below 70', () => {
      const cats = [
        createMockCat({ id: 'cat-1', health: 50 }),
        createMockCat({ id: 'cat-2', health: 60 }),
        createMockCat({ id: 'cat-3', health: 80 }), // Not sick
      ];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ medicine: 5 }),
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.healAllSickCats();
      });

      const state = mockDeps.getState();
      expect(state.resources.medicine).toBe(3); // -2 for 2 sick cats
      expect(state.cats[0].health).toBe(100);
      expect(state.cats[1].health).toBe(100);
      expect(state.cats[2].health).toBe(80); // Unchanged
    });

    it('should show message when all cats are healthy', () => {
      const cats = [
        createMockCat({ id: 'cat-1', health: 100 }),
        createMockCat({ id: 'cat-2', health: 90 }),
      ];
      mockDeps = createMockDependencies({ cats });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.healAllSickCats();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });

    it('should not heal when not enough medicine', () => {
      const cats = [
        createMockCat({ id: 'cat-1', health: 50 }),
        createMockCat({ id: 'cat-2', health: 60 }),
      ];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ medicine: 1 }),
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.healAllSickCats();
      });

      expect(mockDeps.getState().cats[0].health).toBe(50); // Unchanged
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });
  });

  describe('restAllTiredCats', () => {
    it('should rest all cats with rest level below 50', () => {
      const cats = [
        createMockCat({ id: 'cat-1', restLevel: 30 }),
        createMockCat({ id: 'cat-2', restLevel: 40 }),
        createMockCat({ id: 'cat-3', restLevel: 80 }), // Not tired
      ];
      mockDeps = createMockDependencies({ cats });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.restAllTiredCats();
      });

      const state = mockDeps.getState();
      expect(state.cats[0].restLevel).toBe(60); // +30
      expect(state.cats[1].restLevel).toBe(70); // +30
      expect(state.cats[2].restLevel).toBe(80); // Unchanged
    });

    it('should show message when all cats are rested', () => {
      const cats = [
        createMockCat({ id: 'cat-1', restLevel: 100 }),
        createMockCat({ id: 'cat-2', restLevel: 80 }),
      ];
      mockDeps = createMockDependencies({ cats });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.restAllTiredCats();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });

    it('should give happiness boost when resting', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 30, happiness: 70 });
      mockDeps = createMockDependencies({ cats: [cat] });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.restAllTiredCats();
      });

      expect(mockDeps.getState().cats[0].happiness).toBe(75); // +5
    });
  });

  describe('comfortAllUnhappyCats', () => {
    it('should comfort all cats with happiness below 50', () => {
      const cats = [
        createMockCat({ id: 'cat-1', happiness: 30, health: 80 }),
        createMockCat({ id: 'cat-2', happiness: 40, health: 90 }),
        createMockCat({ id: 'cat-3', happiness: 80, health: 100 }), // Happy
      ];
      mockDeps = createMockDependencies({ cats });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.comfortAllUnhappyCats();
      });

      const state = mockDeps.getState();
      expect(state.cats[0].happiness).toBe(60); // +30
      expect(state.cats[0].health).toBe(85); // +5
      expect(state.cats[1].happiness).toBe(70); // +30
      expect(state.cats[2].happiness).toBe(80); // Unchanged
    });

    it('should show message when all cats are happy', () => {
      const cats = [createMockCat({ id: 'cat-1', happiness: 100 })];
      mockDeps = createMockDependencies({ cats });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.comfortAllUnhappyCats();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });
  });

  describe('trainAllAvailableCats', () => {
    it('should train all cats that can train today', () => {
      const cats = [
        createMockCat({ id: 'cat-1', lastTrainingDay: 0, tricksLearned: [] }),
        createMockCat({ id: 'cat-2', lastTrainingDay: 0, tricksLearned: [] }),
      ];
      mockDeps = createMockDependencies({
        cats,
        day: 1,
        resources: createMockResources({ treats: 10, toys: 10 }),
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.trainAllAvailableCats();
      });

      const state = mockDeps.getState();
      expect(state.resources.treats).toBe(8); // -2
      expect(state.resources.toys).toBe(8); // -2
      expect(state.cats[0].lastTrainingDay).toBe(1);
      expect(state.cats[1].lastTrainingDay).toBe(1);
    });

    it('should skip cats already trained today', () => {
      const cats = [
        createMockCat({ id: 'cat-1', lastTrainingDay: 5, tricksLearned: [] }), // Already trained
        createMockCat({ id: 'cat-2', lastTrainingDay: 0, tricksLearned: [] }),
      ];
      mockDeps = createMockDependencies({
        cats,
        day: 5,
        resources: createMockResources({ treats: 10, toys: 10 }),
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.trainAllAvailableCats();
      });

      expect(mockDeps.getState().resources.treats).toBe(9); // Only -1 for cat-2
    });

    it('should not train when not enough resources', () => {
      const cats = [
        createMockCat({ id: 'cat-1', lastTrainingDay: 0, tricksLearned: [] }),
        createMockCat({ id: 'cat-2', lastTrainingDay: 0, tricksLearned: [] }),
      ];
      mockDeps = createMockDependencies({
        cats,
        day: 1,
        resources: createMockResources({ treats: 1, toys: 1 }),
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.trainAllAvailableCats();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should show message when no cats available', () => {
      const cats = [
        createMockCat({
          id: 'cat-1',
          lastTrainingDay: 5,
          tricksLearned: ['sit', 'paw', 'rollOver', 'jump', 'fetch'],
        }),
      ];
      mockDeps = createMockDependencies({ cats, day: 5 });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.trainAllAvailableCats();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });
  });

  describe('sellSelectedCats', () => {
    it('should sell multiple cats and add money', () => {
      const cats = [
        createMockCat({ id: 'cat-1', value: 100, showWins: 0 }),
        createMockCat({ id: 'cat-2', value: 150, showWins: 0 }),
        createMockCat({ id: 'cat-3', value: 200, showWins: 0 }),
      ];
      mockDeps = createMockDependencies({ cats, money: 0 });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.sellSelectedCats(['cat-1', 'cat-3']);
      });

      const state = mockDeps.getState();
      expect(state.cats).toHaveLength(1);
      expect(state.cats[0].id).toBe('cat-2');
      expect(state.money).toBe(300); // 100 + 200
    });

    it('should calculate sell price with show win bonus', () => {
      const cat = createMockCat({ id: 'cat-1', value: 100, showWins: 5 });
      mockDeps = createMockDependencies({ cats: [cat], money: 0 });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.sellSelectedCats(['cat-1']);
      });

      // 100 * (1 + 5 * 0.1) = 150
      expect(mockDeps.getState().money).toBe(150);
    });

    it('should remove relationships for sold cats', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ cats: [cat] });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.sellSelectedCats(['cat-1']);
      });

      expect(mockDeps.deps.relationshipSystem.removeCatRelationships).toHaveBeenCalledWith('cat-1');
    });

    it('should do nothing with empty array', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ cats: [cat], money: 100 });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.sellSelectedCats([]);
      });

      expect(mockDeps.getState().cats).toHaveLength(1);
      expect(mockDeps.getState().money).toBe(100);
    });

    it('should remove costume associations when cats are sold in bulk', () => {
      const cats = [
        createMockCat({ id: 'cat-1', value: 100 }),
        createMockCat({ id: 'cat-2', value: 100 }),
        createMockCat({ id: 'cat-3', value: 100 }),
      ];
      mockDeps = createMockDependencies({
        cats,
        catCostumes: {
          'cat-1': 'crown',
          'cat-2': 'party_hat',
          'cat-3': 'bow_tie',
        },
      });

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.sellSelectedCats(['cat-1', 'cat-3']);
      });

      const costumes = mockDeps.getState().catCostumes;
      expect(costumes['cat-1']).toBeUndefined();
      expect(costumes['cat-2']).toBe('party_hat'); // Kept
      expect(costumes['cat-3']).toBeUndefined();
    });
  });

  describe('socializeAllNeglected', () => {
    it('should show message when no neglected relationships', () => {
      mockDeps = createMockDependencies({ cats: [] });
      mockDeps.deps.relationshipSystem.relationships = [];

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.socializeAllNeglected();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'info' }));
    });

    it('should not socialize without enough treats', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        day: 10,
        resources: createMockResources({ treats: 1 }),
      });

      mockDeps.deps.relationshipSystem.relationships = [
        {
          catId1: 'cat-1',
          catId2: 'cat-2',
          score: 20,
          level: 'friend',
          lastInteraction: 5, // 5 days ago
        },
      ];

      const { result } = renderHook(() => useBulkActions(mockDeps.deps));

      act(() => {
        result.current.socializeAllNeglected();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });
  });
});
