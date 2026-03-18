import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import { inheritAppearance } from '../appearanceInheritance';

describe('inheritAppearance', () => {
  it('should be a function', () => {
    expect(typeof inheritAppearance).toBe('function');
  });

  it('should return an appearance object with required fields', () => {
    const parent1 = {
      id: 'c1', type: 'adopted' as const, breed: 'tabby' as const, name: 'P1',
      health: 100, happiness: 100, hunger: 50, value: 100, age: 1,
      personality: 'playful' as const, showWins: 0, isForSale: false, grade: 5,
      tricksLearned: [] as any[], trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
      restLevel: 100, feedingScore: 0, lastTrainingDay: 0,
      appearance: { furColor: 'orange' as const, pattern: 'tabby' as const, eyeColor: 'green' as const, hairLength: 'short' as const, facialFeatures: [] as any[] },
    };
    const parent2 = {
      ...parent1, id: 'c2', name: 'P2',
      appearance: { furColor: 'black' as const, pattern: 'solid' as const, eyeColor: 'blue' as const, hairLength: 'fluffy' as const, facialFeatures: [] as any[] },
    };

    const child = inheritAppearance(parent1 as any, parent2 as any);
    expect(child).toHaveProperty('furColor');
    expect(child).toHaveProperty('pattern');
    expect(child).toHaveProperty('eyeColor');
  });
});
