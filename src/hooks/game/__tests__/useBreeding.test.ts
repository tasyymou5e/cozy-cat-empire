/**
 * @fileoverview Tests for useBreeding hook
 *
 * Tests cat breeding mechanics: compatibility, cooldowns, kitten creation,
 * and appearance inheritance.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreeding } from '../useBreeding';
import { createMockDependencies, createMockCat } from '@/test/mocks/gameHookMocks';
import { CatAppearance } from '@/types/catAppearance';

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
        breedingCooldown: 0,
      });

      // Mock compatibility check to allow breeding
      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 10,
        message: 'Good compatibility',
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
        breedingCooldown: 3,
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should not breed when no space available', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 2,
        breedingCooldown: 0,
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should not breed incompatible cats', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });
      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 5,
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: false,
        bonus: -20,
        message: 'These cats are enemies!',
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      expect(mockDeps.getState().cats).toHaveLength(2);
      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'error' }));
    });

    it('should track kittens bred count', () => {
      const cat1 = createMockCat({ id: 'cat-1', grade: 10 });
      const cat2 = createMockCat({ id: 'cat-2', grade: 10 });
      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 5,
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 5,
        message: 'Compatible',
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
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 10,
        message: 'Compatible',
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
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 0,
        message: 'OK',
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

  describe('appearance inheritance', () => {
    it('should inherit appearance from parents', () => {
      const parentAppearance1: CatAppearance = {
        furColor: 'orange',
        pattern: 'tabby',
        patternColor: '#1C1917',
        eyeColor: 'green',
        hairLength: 'medium',
        facialFeature: 'normal',
      };
      const parentAppearance2: CatAppearance = {
        furColor: 'white',
        pattern: 'solid',
        patternColor: '#78350F',
        eyeColor: 'blue',
        hairLength: 'fluffy',
        facialFeature: 'normal',
      };

      const cat1 = createMockCat({
        id: 'cat-1',
        name: 'Mom',
        appearance: parentAppearance1,
      });
      const cat2 = createMockCat({
        id: 'cat-2',
        name: 'Dad',
        appearance: parentAppearance2,
      });

      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 5,
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 10,
        message: 'Compatible',
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      const state = mockDeps.getState();
      const kitten = state.cats[2];

      expect(kitten).toBeDefined();
      expect(kitten.appearance).toBeDefined();
      expect(kitten.appearance).toHaveProperty('furColor');
      expect(kitten.appearance).toHaveProperty('pattern');
      expect(kitten.appearance).toHaveProperty('eyeColor');
      expect(kitten.appearance).toHaveProperty('hairLength');
      expect(kitten.appearance).toHaveProperty('facialFeature');
    });

    it('should handle parents without custom appearances', () => {
      const cat1 = createMockCat({ id: 'cat-1', breed: 'persian' });
      const cat2 = createMockCat({ id: 'cat-2', breed: 'siamese' });

      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 5,
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 0,
        message: 'OK',
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      const kitten = mockDeps.getState().cats[2];

      // Should still have appearance (from breed defaults)
      expect(kitten.appearance).toBeDefined();
      expect(kitten.appearance?.furColor).toBeDefined();
    });

    it('should create valid CatAppearance structure', () => {
      const cat1 = createMockCat({ id: 'cat-1' });
      const cat2 = createMockCat({ id: 'cat-2' });

      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        space: 5,
        breedingCooldown: 0,
      });

      mockDeps.deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
        canBreed: true,
        bonus: 5,
        message: 'OK',
      });

      const { result } = renderHook(() => useBreeding(mockDeps.deps));

      act(() => {
        result.current.breedCats('cat-1', 'cat-2');
      });

      const kitten = mockDeps.getState().cats[2];
      const validFurColors = ['orange', 'black', 'white', 'gray', 'brown', 'cream', 'ginger', 'calico'];
      const validPatterns = ['solid', 'tabby', 'spotted', 'tuxedo', 'bicolor', 'calico'];
      const validEyeColors = ['green', 'blue', 'amber', 'gold', 'heterochromia', 'copper'];
      const validHairLengths = ['short', 'medium', 'fluffy'];
      const validFacialFeatures = ['normal', 'scar', 'eyepatch', 'whiskers_long', 'grumpy', 'cute_blush'];

      expect(validFurColors).toContain(kitten.appearance?.furColor);
      expect(validPatterns).toContain(kitten.appearance?.pattern);
      expect(validEyeColors).toContain(kitten.appearance?.eyeColor);
      expect(validHairLengths).toContain(kitten.appearance?.hairLength);
      expect(validFacialFeatures).toContain(kitten.appearance?.facialFeature);
    });
  });
});
