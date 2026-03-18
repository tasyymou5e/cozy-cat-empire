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
    const parent1 = { furColor: 'orange' as const, pattern: 'tabby' as const, eyeColor: 'green' as const, hairLength: 'short' as const, facialFeatures: [] as any[] };
    const parent2 = { furColor: 'black' as const, pattern: 'solid' as const, eyeColor: 'blue' as const, hairLength: 'fluffy' as const, facialFeatures: [] as any[] };

    const child = inheritAppearance(parent1, parent2);
    expect(child).toHaveProperty('furColor');
    expect(child).toHaveProperty('pattern');
    expect(child).toHaveProperty('eyeColor');
  });
});
