/**
 * @fileoverview Tests for useBreeding hook
 * 
 * Tests cat breeding mechanics: compatibility, cooldowns, kitten creation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreeding } from '../useBreeding';
import { 
  createMockDependencies, 
  createMockCat,
} from '@/test/mocks/gameHookMocks';

describe('useBreeding', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('breedCats', () => {
    it('should breed two cats and create a kitten', () => {
      const cat1 = createMockCat({ id: 'cat-1', name: 'Mom', breed: 'persian', grade: 10 });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Dad', breed: 'siamese', grade: 8 });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 5,
        breedingCooldown: 0 
      });
      
      // Mock compatibility check to allow breeding
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 10,
        message: 'Good compatibility'
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      const state = mockDeps.getState();
      expect(state.cats).toHaveLength(3); // 2 parents + 1 kitten
      expect(state.breedingCooldown).toBe(5);
    });

    it('should not breed when on cooldown', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        breedingCooldown: 3 
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should not breed when no space available', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 2,
        breedingCooldown: 0 
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should not breed incompatible cats', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 5,
        breedingCooldown: 0 
      });
      
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: false,
        bonus: -20,
        message: 'These cats are enemies!'
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should track kittens bred count', () => {
      const cat1 = createMockCat({ id: 'cat-1', grade: 10 });
      const cat2 = createMockCat({ id: 'cat-2', grade: 10 });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 5,
        breedingCooldown: 0 
      });
      
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 5,
        message: 'Compatible'
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.deps.setKittensBreed).toHaveBeenCalled();
    });

    it('should add relationship event for parents', () => {
      const cat1 = createMockCat({ id: 'cat-1', name: 'Mom' });
      const cat2 = createMockCat({ id: 'cat-2', name: 'Dad' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 5,
        breedingCooldown: 0 
      });
      
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 10,
        message: 'Compatible'
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.deps.relationshipSystem.addEvent).toHaveBeenCalled();
    });

    it('should trigger challenge progress for breeding', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({ 
        cats: [cat1, cat2], 
        space: 5,
        breedingCooldown: 0 
      });
      
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 0,
        message: 'OK'
      });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });
      
      expect(mockDeps.deps.onChallengeProgress).toHaveBeenCalledWith('breed_kittens', 1);
    });

    it('should return without changes if cats not found', () => {
      mockDeps = createMockDependencies({ cats: [], space: 5 });
      
      const { result } = renderHook(() => useBreeding(mockDeps.deps));
      
      act(() => {
        result.current.breedCats('invalid-1', 'invalid-2');
      });
      
      expect(mockDeps.getState().cats).toHaveLength(0);
    });
  });
});
