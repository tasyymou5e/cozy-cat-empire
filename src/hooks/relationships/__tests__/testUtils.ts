/**
 * Test utilities for relationship hook tests
 */

import { Cat, CatPersonality } from '@/types/game';

interface MockCatOptions {
  id?: string;
  name?: string;
  personality?: CatPersonality;
  health?: number;
  happiness?: number;
  hunger?: number;
}

/**
 * Create a mock cat for testing
 */
export function createMockCat(options: MockCatOptions = {}): Cat {
  return {
    id: options.id ?? `cat-${Math.random().toString(36).substr(2, 9)}`,
    name: options.name ?? 'TestCat',
    type: 'adopted',
    breed: 'tabby',
    health: options.health ?? 100,
    happiness: options.happiness ?? 100,
    hunger: options.hunger ?? 100,
    value: 100,
    age: 1,
    personality: options.personality ?? 'playful',
    showWins: 0,
    isForSale: false,
    grade: 5,
    tricksLearned: [],
    trickProgress: {
      sit: 0,
      paw: 0,
      rollOver: 0,
      jump: 0,
      fetch: 0,
    },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
  };
}

/**
 * Create multiple mock cats
 */
export function createMockCats(count: number, baseOptions: MockCatOptions = {}): Cat[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCat({
      ...baseOptions,
      id: baseOptions.id ? `${baseOptions.id}-${i}` : `cat-${i}`,
      name: baseOptions.name ? `${baseOptions.name} ${i + 1}` : `Cat ${i + 1}`,
    })
  );
}
