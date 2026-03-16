/**
 * @fileoverview Feature-level integration tests for breeding flow
 *
 * Tests: "Breed cats → kitten inherits traits → grade calculated"
 * Validates the full breeding pipeline using real hook logic.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreeding } from '@/hooks/game/useBreeding';
import { createMockDependencies, createMockCat } from '@/test/mocks/gameHookMocks';

describe('Breeding Flow Integration', () => {
  it('breeds two cats → creates kitten with inherited traits and correct grade', () => {
    const parent1 = createMockCat({
      id: 'parent-1',
      name: 'Luna',
      breed: 'persian',
      grade: 12,
    });
    const parent2 = createMockCat({
      id: 'parent-2',
      name: 'Orion',
      breed: 'siamese',
      grade: 8,
    });

    const { deps, getState, getMessages } = createMockDependencies({
      cats: [parent1, parent2],
      space: 5,
      breedingCooldown: 0,
    });

    // Make compatibility return positive
    deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
      canBreed: true,
      bonus: 10,
      message: 'Good friends',
    });

    const { result } = renderHook(() => useBreeding(deps));

    act(() => {
      result.current.breedCats('parent-1', 'parent-2');
    });

    const state = getState();

    // Kitten was created
    expect(state.cats).toHaveLength(3);

    const kitten = state.cats[2];
    expect(kitten.type).toBe('pure');
    expect(['persian', 'siamese']).toContain(kitten.breed);

    // Grade is averaged from parents (12+8)/2 = 10 ± variance + bonus
    expect(kitten.grade).toBeGreaterThanOrEqual(1);
    expect(kitten.grade).toBeLessThanOrEqual(20);

    // Kitten has default trick progress
    expect(kitten.trickProgress).toHaveProperty('sit');
    expect(kitten.tricksLearned).toEqual([]);

    // Kitten has appearance inherited from parents
    expect(kitten.appearance).toBeDefined();

    // Breeding cooldown was set
    expect(state.breedingCooldown).toBe(5);

    // Success message was shown
    expect(getMessages().some((m) => m.type === 'success')).toBe(true);

    // Relationship event was added for parents
    expect(deps.relationshipSystem.addEvent).toHaveBeenCalledWith(
      parent1,
      parent2,
      'positive',
      expect.stringContaining('kitten'),
      15,
      expect.any(Number),
    );

    // Challenge progress was reported
    expect(deps.onChallengeProgress).toHaveBeenCalledWith('breed_kittens', 1);
  });

  it('blocks breeding when no space available', () => {
    const parent1 = createMockCat({ id: 'p1' });
    const parent2 = createMockCat({ id: 'p2' });

    const { deps, getState, getMessages } = createMockDependencies({
      cats: [parent1, parent2],
      space: 2, // full
      breedingCooldown: 0,
    });

    const { result } = renderHook(() => useBreeding(deps));

    act(() => {
      result.current.breedCats('p1', 'p2');
    });

    expect(getState().cats).toHaveLength(2);
    expect(getMessages().some((m) => m.type === 'warning')).toBe(true);
  });

  it('blocks breeding during cooldown', () => {
    const parent1 = createMockCat({ id: 'p1' });
    const parent2 = createMockCat({ id: 'p2' });

    const { deps, getState } = createMockDependencies({
      cats: [parent1, parent2],
      space: 5,
      breedingCooldown: 3,
    });

    const { result } = renderHook(() => useBreeding(deps));

    act(() => {
      result.current.breedCats('p1', 'p2');
    });

    expect(getState().cats).toHaveLength(2);
  });

  it('triggers Perfect Match achievement when breeding best friends', () => {
    const parent1 = createMockCat({ id: 'bf1', name: 'Milo' });
    const parent2 = createMockCat({ id: 'bf2', name: 'Cleo' });

    const { deps, getMessages } = createMockDependencies({
      cats: [parent1, parent2],
      space: 5,
      breedingCooldown: 0,
    });

    deps.relationshipSystem.getBreedingCompatibility = vi.fn().mockReturnValue({
      canBreed: true,
      bonus: 25,
      message: 'Best friends!',
    });
    deps.relationshipSystem.getRelationship = vi.fn().mockReturnValue({
      catId1: 'bf1',
      catId2: 'bf2',
      level: 'bestFriend',
      score: 85,
      lastInteraction: 1,
    });

    const { result } = renderHook(() => useBreeding(deps));

    act(() => {
      result.current.breedCats('bf1', 'bf2');
    });

    expect(getMessages().some((m) => m.msg.includes('Perfect Match'))).toBe(true);
    expect(deps.checkAchievements).toHaveBeenCalledWith(
      expect.any(Object),
      1,
      true, // wasBestFriendBreed
    );
  });
});
