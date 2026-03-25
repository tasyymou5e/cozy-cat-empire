import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/types/prestige', () => ({
  MAX_PRESTIGE_LEVEL: 3,
  PRESTIGE_RESET_GRADE: 10,
  PRESTIGE_LEVELS: [{ level: 1, costumeReward: 'crown' }],
  calculatePrestigeBonuses: () => ({ showEarningsBonus: 0.1, breedingSuccessBonus: 0.05 }),
  getPrestigeLevelInfo: () => null,
}));

describe('usePrestige', () => {
  it('should check if a cat can prestige', async () => {
    const { usePrestige } = await import('../usePrestige');
    const { result } = renderHook(() => usePrestige());
    const cat = { id: '1', grade: 15, prestigeLevel: 0 } as any;
    expect(result.current.canPrestige(cat)).toBe(false); // grade not 20
  });

  it('should allow prestige for grade 20 cat', async () => {
    const { usePrestige } = await import('../usePrestige');
    const { result } = renderHook(() => usePrestige());
    const cat = { id: '1', grade: 20, prestigeLevel: 0 } as any;
    expect(result.current.canPrestige(cat)).toBe(true);
  });
});
