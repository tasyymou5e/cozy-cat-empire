import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/types/specializations', () => ({
  SPECIALIZATIONS: {},
  checkSpecializationEligibility: () => ({ eligible: false, reason: 'Not ready' }),
  getMasteryLevel: () => null,
  getNextMasteryLevel: () => null,
}));

describe('useSpecializations', () => {
  it('should provide specialization check functions', async () => {
    const { useSpecializations } = await import('../useSpecializations');
    const { result } = renderHook(() => useSpecializations());
    expect(typeof result.current.canSpecialize).toBe('function');
    expect(typeof result.current.getActiveBonuses).toBe('function');
  });

  it('should return zero bonuses with no specialized cats', async () => {
    const { useSpecializations } = await import('../useSpecializations');
    const { result } = renderHook(() => useSpecializations());
    const bonuses = result.current.getActiveBonuses([]);
    expect(bonuses.showScoreBonus).toBe(0);
  });
});
