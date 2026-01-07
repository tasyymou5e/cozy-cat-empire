/**
 * @fileoverview Mock utilities for game domain hooks
 * 
 * Provides reusable mocks and factories for testing game hooks.
 * These mocks simulate the dependencies passed to domain hooks.
 * 
 * @module test/mocks/gameHookMocks
 */

import { vi } from 'vitest';
import { GameState, Cat, Resources } from '@/types/game';
import { GameHookDependencies } from '@/hooks/game/types';
import { CatRelationship, RelationshipEvent } from '@/types/relationships';

/**
 * Creates a mock cat for testing
 */
export function createMockCat(overrides: Partial<Cat> = {}): Cat {
  return {
    id: `cat-${Math.random().toString(36).slice(2)}`,
    type: 'adopted',
    breed: 'tabby',
    name: 'TestCat',
    health: 100,
    happiness: 100,
    hunger: 50,
    value: 100,
    age: 1,
    personality: 'playful',
    showWins: 0,
    isForSale: false,
    grade: 5,
    tricksLearned: [],
    trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
    ...overrides,
  };
}

/**
 * Creates mock resources for testing
 */
export function createMockResources(overrides: Partial<Resources> = {}): Resources {
  return {
    food: 10,
    medicine: 5,
    toys: 5,
    treats: 5,
    ...overrides,
  };
}

/**
 * Creates a mock game state for testing
 */
export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    cats: [],
    money: 500,
    space: 5,
    houseSize: 'apartment',
    acres: 0,
    day: 1,
    resources: createMockResources(),
    reputation: 0,
    totalShowWins: 0,
    catsAdopted: 0,
    totalMoneyEarned: 0,
    marketListings: [],
    achievements: [],
    breedingCooldown: 0,
    showCooldown: 0,
    ownedCostumes: [],
    catCostumes: {},
    ...overrides,
  };
}

/**
 * Creates a mock relationship system for testing
 * Returns a minimal mock that satisfies RelationshipSystem type
 */
export function createMockRelationshipSystem(): ReturnType<typeof import('@/hooks/useRelationships').useRelationships> {
  return {
    relationships: [] as CatRelationship[],
    events: [] as RelationshipEvent[],
    groups: [],
    lastEventId: null,
    maintenanceStreak: 0,
    longestMaintenanceStreak: 0,
    getRelationship: vi.fn().mockReturnValue(null),
    updateRelationship: vi.fn(),
    addEvent: vi.fn(),
    socializeCats: vi.fn(),
    processDailyRelationships: vi.fn(),
    processRelationshipDecay: vi.fn(),
    checkMaintenanceStreak: vi.fn(),
    detectGroups: vi.fn(),
    getHappinessModifier: vi.fn().mockReturnValue(0),
    getBreedingCompatibility: vi.fn().mockReturnValue({ canBreed: true, bonus: 0, message: 'Compatible' }),
    removeCatRelationships: vi.fn(),
    loadRelationships: vi.fn(),
    getRelationshipSaveData: vi.fn().mockReturnValue({
      relationships: [],
      events: [],
      maintenanceStreak: 0,
      longestMaintenanceStreak: 0,
      lastMaintenanceDay: null,
    }),
  };
}

/**
 * Creates mock game hook dependencies for testing
 * 
 * @param initialState - Initial game state
 * @param stateRef - Optional ref to track state changes
 * @returns Mock dependencies object
 * 
 * @example
 * ```typescript
 * const { deps, getState, getMessages } = createMockDependencies();
 * const actions = useCatManagement(deps);
 * 
 * actions.addCat('stray');
 * 
 * expect(getState().cats).toHaveLength(1);
 * expect(getMessages()).toContain('Welcome');
 * ```
 */
export function createMockDependencies(initialState?: Partial<GameState>) {
  let state = createMockGameState(initialState);
  const messages: Array<{ msg: string; type: string }> = [];
  const sounds: string[] = [];
  let kittensBreed = 0;
  
  const setState = vi.fn().mockImplementation((updater) => {
    if (typeof updater === 'function') {
      state = updater(state);
    } else {
      state = updater;
    }
  });
  
  const showMessage = vi.fn().mockImplementation((msg: string, type = 'info') => {
    messages.push({ msg, type });
  });
  
  const playSound = vi.fn().mockImplementation((sound: string) => {
    sounds.push(sound);
  });
  
  const onChallengeProgress = vi.fn();
  
  const setKittensBreed = vi.fn().mockImplementation((updater) => {
    if (typeof updater === 'function') {
      kittensBreed = updater(kittensBreed);
    } else {
      kittensBreed = updater;
    }
  });
  
  const checkAchievements = vi.fn().mockImplementation((newState: GameState) => newState);
  
  const deps: GameHookDependencies = {
    state,
    setState,
    showMessage,
    playSound,
    relationshipSystem: createMockRelationshipSystem(),
    onChallengeProgress,
    kittensBreed,
    setKittensBreed,
    checkAchievements,
  };
  
  return {
    deps,
    /** Get current state after mutations */
    getState: () => state,
    /** Get all messages shown */
    getMessages: () => messages,
    /** Get all sounds played */
    getSounds: () => sounds,
    /** Get kittens bred count */
    getKittensBreed: () => kittensBreed,
    /** Reset all mocks */
    reset: () => {
      state = createMockGameState(initialState);
      messages.length = 0;
      sounds.length = 0;
      kittensBreed = 0;
      vi.clearAllMocks();
    },
  };
}

/**
 * Helper to wait for state updates in tests
 */
export async function waitForStateUpdate(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}
