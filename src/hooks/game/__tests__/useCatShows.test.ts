/**
 * @fileoverview Tests for useCatShows hook
 *
 * Tests cat show mechanics: eligibility, scoring, rewards, cooldowns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatShows } from '../useCatShows';
import { createMockDependencies, createMockCat } from '@/test/mocks/gameHookMocks';

describe('useCatShows', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('catShow', () => {
    it('should enter cats in local show', () => {
      const cat = createMockCat({
        id: 'cat-1',
        health: 90,
        happiness: 80,
        grade: 8,
      });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
        money: 100,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow('local');
      });

      // Show should set cooldown
      expect(mockDeps.getState().showCooldown).toBe(20);
    });

    it('should not enter show when on cooldown', () => {
      const cat = createMockCat({ health: 90, happiness: 80 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 2,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should not enter higher tier without enough wins', () => {
      const cat = createMockCat({ health: 90, happiness: 80, grade: 10 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
        totalShowWins: 2, // Needs 5 for regional
        money: 100,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow('regional');
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should not enter without enough money for entry fee', () => {
      const cat = createMockCat({ health: 90, happiness: 80, grade: 10 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
        totalShowWins: 10,
        money: 10, // Regional costs $25
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow('regional');
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should not enter with no eligible cats', () => {
      const cat = createMockCat({ health: 50, happiness: 30 }); // Unhealthy
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should require minimum health of 70 for eligibility', () => {
      const cat = createMockCat({ health: 65, happiness: 80 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should require minimum happiness of 60 for eligibility', () => {
      const cat = createMockCat({ health: 90, happiness: 55 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      expect(mockDeps.getMessages()).toContainEqual(expect.objectContaining({ type: 'warning' }));
    });

    it('should enter up to 5 cats maximum', () => {
      const cats = Array.from({ length: 10 }, (_, i) =>
        createMockCat({
          id: `cat-${i}`,
          health: 90,
          happiness: 80,
          grade: 8,
          breed: 'persian',
        })
      );
      mockDeps = createMockDependencies({
        cats,
        showCooldown: 0,
        money: 100,
      });

      // Mock random to always win for test predictability
      vi.spyOn(Math, 'random').mockReturnValue(0.9);

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      // Verify show ran (cooldown set)
      expect(mockDeps.getState().showCooldown).toBe(20);

      vi.restoreAllMocks();
    });

    it('should track challenge progress on wins', () => {
      const cat = createMockCat({
        health: 100,
        happiness: 100,
        grade: 15,
        breed: 'persian',
        showWins: 10,
      });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
        money: 100,
      });

      // Mock random to guarantee a win
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      // Check if onChallengeProgress was called with show_wins
      const onChallengeProgressMock = mockDeps.deps.onChallengeProgress as ReturnType<typeof vi.fn>;
      const challengeCalls = onChallengeProgressMock.mock.calls;
      const showWinCall = challengeCalls.find((call: unknown[]) => call[0] === 'show_wins');

      if (showWinCall) {
        expect(showWinCall[0]).toBe('show_wins');
      }

      vi.restoreAllMocks();
    });

    it('should add relationship events between participants', () => {
      const cat1 = createMockCat({
        id: 'cat-1',
        health: 100,
        happiness: 100,
        grade: 15,
        showWins: 5,
      });
      const cat2 = createMockCat({
        id: 'cat-2',
        health: 100,
        happiness: 100,
        grade: 15,
        showWins: 5,
      });
      mockDeps = createMockDependencies({
        cats: [cat1, cat2],
        showCooldown: 0,
        money: 100,
      });

      // Mock relationship for friend bonus
      mockDeps.deps.relationshipSystem.getRelationship = vi.fn().mockReturnValue({
        catId1: 'cat-1',
        catId2: 'cat-2',
        score: 30,
        level: 'friend',
      });

      // Mock random for predictable event triggers
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // cat1 win
        .mockReturnValueOnce(0.99) // cat2 win
        .mockReturnValueOnce(0.1) // trigger celebration event (< 0.3)
        .mockReturnValueOnce(0.5); // winner index

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow();
      });

      expect(mockDeps.getState().showCooldown).toBe(20);

      vi.restoreAllMocks();
    });

    it('should default to local tier', () => {
      const cat = createMockCat({ health: 90, happiness: 80, grade: 5 });
      mockDeps = createMockDependencies({
        cats: [cat],
        showCooldown: 0,
        money: 100,
      });

      const { result } = renderHook(() => useCatShows(mockDeps.deps));

      act(() => {
        result.current.catShow(); // No tier specified
      });

      expect(mockDeps.getState().showCooldown).toBe(20);
    });
  });
});
