/**
 * @fileoverview Tests for useResources hook
 *
 * Tests resource management: buying, feeding, medicine, toys.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResources } from '../useResources';
import {
  createMockDependencies,
  createMockCat,
  createMockResources,
} from '@/test/mocks/gameHookMocks';

describe('useResources', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('buyResource', () => {
    it('should buy food and deduct money', () => {
      mockDeps = createMockDependencies({
        money: 100,
        resources: createMockResources({ food: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.buyResource('food', 10);
      });

      expect(mockDeps.getState().money).toBe(90);
      expect(mockDeps.getState().resources.food).toBe(10); // 5 + 5
    });

    it('should buy medicine', () => {
      mockDeps = createMockDependencies({
        money: 100,
        resources: createMockResources({ medicine: 2 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.buyResource('medicine', 25);
      });

      expect(mockDeps.getState().money).toBe(75);
      expect(mockDeps.getState().resources.medicine).toBe(7);
    });

    it('should not buy when not enough money', () => {
      mockDeps = createMockDependencies({ money: 5 });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.buyResource('food', 10);
      });

      expect(mockDeps.getState().money).toBe(5);
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'error' }));
    });
  });

  describe('feedCats', () => {
    it('should feed all cats and use food', () => {
      const cats = [createMockCat({ hunger: 50 }), createMockCat({ hunger: 40 })];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ food: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.feedCats();
      });

      expect(mockDeps.getState().resources.food).toBe(3); // 5 - 2 cats
      // Each cat gets +30 hunger, capped at 100
      expect(mockDeps.getState().cats[0].hunger).toBe(80); // 50 + 30
      expect(mockDeps.getState().cats[1].hunger).toBe(70); // 40 + 30
    });

    it('should increase happiness and health when feeding', () => {
      const cat = createMockCat({ hunger: 50, happiness: 80, health: 90 });
      mockDeps = createMockDependencies({
        cats: [cat],
        resources: createMockResources({ food: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.feedCats();
      });

      const fedCat = mockDeps.getState().cats[0];
      expect(fedCat.happiness).toBe(83); // +3
      expect(fedCat.health).toBe(95); // +5
    });

    it('should not feed when not enough food', () => {
      const cats = [createMockCat(), createMockCat(), createMockCat()];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ food: 2 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.feedCats();
      });

      expect(mockDeps.getState().resources.food).toBe(2); // Unchanged
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });
  });

  describe('feedSingleCat', () => {
    it('should feed a single cat', () => {
      const cat = createMockCat({ id: 'cat-1', hunger: 40 });
      mockDeps = createMockDependencies({
        cats: [cat],
        resources: createMockResources({ food: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.feedSingleCat('cat-1');
      });

      expect(mockDeps.getState().resources.food).toBe(4); // -1
      expect(mockDeps.getState().cats[0].hunger).toBe(70); // +30
    });

    it('should not feed when no food available', () => {
      const cat = createMockCat({ id: 'cat-1', hunger: 40 });
      mockDeps = createMockDependencies({
        cats: [cat],
        resources: createMockResources({ food: 0 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.feedSingleCat('cat-1');
      });

      expect(mockDeps.getState().cats[0].hunger).toBe(40);
    });
  });

  describe('useToys', () => {
    it('should use toys and increase happiness', () => {
      const cats = [createMockCat({ happiness: 60 }), createMockCat({ happiness: 70 })];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ toys: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.useToys();
      });

      // ceil(2/3) = 1 toy used
      expect(mockDeps.getState().resources.toys).toBe(4);
      // Each cat gets +15 happiness, capped at 100
      expect(mockDeps.getState().cats[0].happiness).toBe(75); // 60 + 15
      expect(mockDeps.getState().cats[1].happiness).toBe(85); // 70 + 15
    });

    it('should create bonding event between cats', () => {
      const cats = [createMockCat(), createMockCat()];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ toys: 5 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.useToys();
      });

      expect(mockDeps.deps.relationshipSystem.addEvent).toHaveBeenCalled();
    });

    it('should not use toys when not enough', () => {
      const cats = [createMockCat(), createMockCat(), createMockCat(), createMockCat()];
      mockDeps = createMockDependencies({
        cats,
        resources: createMockResources({ toys: 0 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.useToys();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });
  });

  describe('useMedicine', () => {
    it('should heal cat to 100 health', () => {
      const cat = createMockCat({ id: 'cat-1', health: 50 });
      mockDeps = createMockDependencies({
        cats: [cat],
        resources: createMockResources({ medicine: 3 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.useMedicine('cat-1');
      });

      expect(mockDeps.getState().resources.medicine).toBe(2);
      expect(mockDeps.getState().cats[0].health).toBe(100);
    });

    it('should not heal when no medicine', () => {
      const cat = createMockCat({ id: 'cat-1', health: 50 });
      mockDeps = createMockDependencies({
        cats: [cat],
        resources: createMockResources({ medicine: 0 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.useMedicine('cat-1');
      });

      expect(mockDeps.getState().cats[0].health).toBe(50);
    });
  });

  describe('addReward', () => {
    it('should add coins and track earnings', () => {
      mockDeps = createMockDependencies({ money: 100, totalMoneyEarned: 500 });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.addReward(50);
      });

      expect(mockDeps.getState().money).toBe(150);
      expect(mockDeps.getState().totalMoneyEarned).toBe(550);
    });

    it('should add resources with reward', () => {
      mockDeps = createMockDependencies({
        resources: createMockResources({ food: 5, toys: 3 }),
      });

      const { result } = renderHook(() => useResources(mockDeps.deps));

      act(() => {
        result.current.addReward(10, { food: 5, toys: 2 });
      });

      expect(mockDeps.getState().resources.food).toBe(10);
      expect(mockDeps.getState().resources.toys).toBe(5);
    });
  });
});
