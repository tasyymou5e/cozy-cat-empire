/**
 * @fileoverview Tests for useTraining hook
 * 
 * Tests training, resting, group activities, and socialization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTraining } from '../useTraining';
import { 
  createMockDependencies, 
  createMockCat,
  createMockResources,
} from '@/test/mocks/gameHookMocks';

describe('useTraining', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('trainCat', () => {
    it('should train a cat and increase trick progress', () => {
      const cat = createMockCat({ id: 'cat-1', lastTrainingDay: 0, restLevel: 100 });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        day: 1,
        resources: createMockResources({ treats: 5, toys: 5 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.trainCat('cat-1', 'sit');
      });
      
      const state = mockDeps.getState();
      expect(state.resources.treats).toBe(4);
      expect(state.resources.toys).toBe(4);
      expect(state.cats[0].trickProgress.sit).toBeGreaterThan(0);
      expect(state.cats[0].lastTrainingDay).toBe(1);
    });

    it('should not train without resources', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        resources: createMockResources({ treats: 0, toys: 0 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.trainCat('cat-1', 'sit');
      });
      
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should not train cat twice in same day', () => {
      const cat = createMockCat({ id: 'cat-1', lastTrainingDay: 5 });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        day: 5,
        resources: createMockResources({ treats: 5, toys: 5 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.trainCat('cat-1', 'sit');
      });
      
      expect(mockDeps.getState().resources.treats).toBe(5); // Unchanged
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should give rest bonus for well-rested cats', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 100, lastTrainingDay: 0 });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        day: 1,
        resources: createMockResources({ treats: 5, toys: 5 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.trainCat('cat-1', 'sit');
      });
      
      // Well-rested cats get +10 bonus, so progress should be 30-50
      expect(mockDeps.getState().cats[0].trickProgress.sit).toBeGreaterThanOrEqual(30);
    });

    it('should reduce rest level after training', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 100, lastTrainingDay: 0 });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        day: 1,
        resources: createMockResources({ treats: 5, toys: 5 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.trainCat('cat-1', 'sit');
      });
      
      expect(mockDeps.getState().cats[0].restLevel).toBe(90); // -10
    });
  });

  describe('restCat', () => {
    it('should increase rest level', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 50 });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.restCat('cat-1');
      });
      
      expect(mockDeps.getState().cats[0].restLevel).toBe(70); // +20
    });

    it('should cap rest level at 100', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 95 });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.restCat('cat-1');
      });
      
      expect(mockDeps.getState().cats[0].restLevel).toBe(100);
    });

    it('should boost happiness', () => {
      const cat = createMockCat({ id: 'cat-1', restLevel: 50, happiness: 70 });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.restCat('cat-1');
      });
      
      expect(mockDeps.getState().cats[0].happiness).toBe(75); // +5
    });

    it('should play purr sound', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ cats: [cat] });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.restCat('cat-1');
      });
      
      expect(mockDeps.getSounds()).toContain('purr');
    });
  });

  describe('socializeCats', () => {
    it('should socialize two cats with treats', () => {
      const cat1 = createMockCat({ id: 'cat-1', name: 'Cat1' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Cat2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 5 })
      });
      
      mockDeps.deps.relationshipSystem.socializeCats = vi.fn().mockReturnValue({
        success: true,
        message: 'Cat1 and Cat2 had a great time!'
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.socializeCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().resources.treats).toBe(3); // -2
    });

    it('should not socialize without enough treats', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 1 })
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.socializeCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().resources.treats).toBe(1); // Unchanged
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should increase happiness for both cats', () => {
      const cat1 = createMockCat({ id: 'cat-1', happiness: 70 });
      const cat2 = createMockCat({ id: 'cat-2', happiness: 60 });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 5 })
      });
      
      mockDeps.deps.relationshipSystem.socializeCats = vi.fn().mockReturnValue({
        success: true,
        message: 'Great socialization!'
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.socializeCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().cats[0].happiness).toBe(75);
      expect(mockDeps.getState().cats[1].happiness).toBe(65);
    });

    it('should track challenge progress', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 5 })
      });
      
      mockDeps.deps.relationshipSystem.socializeCats = vi.fn().mockReturnValue({
        success: true,
        message: 'OK'
      });
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.socializeCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.deps.onChallengeProgress).toHaveBeenCalledWith('socialize', 1);
    });
  });

  describe('doGroupActivity', () => {
    it('should do play activity with toy cost', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ toys: 5 })
      });
      
      // Add a mock group
      mockDeps.deps.relationshipSystem.groups = [{
        id: 'group-1',
        name: 'Friends Group',
        memberIds: ['cat-1', 'cat-2'],
        leaderCatId: 'cat-1',
        type: 'friendly'
      }];
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.doGroupActivity('group-1', 'play');
      });
      
      expect(mockDeps.getState().resources.toys).toBe(4); // -1
    });

    it('should do treat activity with treat cost', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 5 })
      });
      
      mockDeps.deps.relationshipSystem.groups = [{
        id: 'group-1',
        name: 'Friends Group',
        memberIds: ['cat-1', 'cat-2'],
        leaderCatId: 'cat-1',
        type: 'friendly'
      }];
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.doGroupActivity('group-1', 'treat');
      });
      
      expect(mockDeps.getState().resources.treats).toBe(3); // -2
    });

    it('should do nap activity for free', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        resources: createMockResources({ treats: 0, toys: 0 })
      });
      
      mockDeps.deps.relationshipSystem.groups = [{
        id: 'group-1',
        name: 'Friends Group',
        memberIds: ['cat-1', 'cat-2'],
        leaderCatId: 'cat-1',
        type: 'friendly'
      }];
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.doGroupActivity('group-1', 'nap');
      });
      
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'success' })
      );
    });

    it('should not do activity without enough resources', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ 
        cats: [cat1], 
        resources: createMockResources({ toys: 0 })
      });
      
      mockDeps.deps.relationshipSystem.groups = [{
        id: 'group-1',
        name: 'Friends',
        memberIds: ['cat-1'],
        leaderCatId: 'cat-1',
        type: 'friendly'
      }];
      
      const { result } = renderHook(() => useTraining(mockDeps.deps));
      
      act(() => {
        result.current.doGroupActivity('group-1', 'play');
      });
      
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });
  });
});
