import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@/types/legacy', () => ({
  checkRetirementEligibility: vi.fn().mockReturnValue({
    isEligible: false,
    meetsAge: false,
    meetsShowWins: false,
    meetsGrade: false,
    meetsTricks: false,
    achievementCount: 0,
  }),
  determineLegacyTrait: vi.fn().mockReturnValue('show_lineage'),
  calculateLegacyBonus: vi.fn().mockReturnValue(5),
}));

import { useLegacy } from '../useLegacy';

describe('useLegacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: null }),
        }),
      }),
    });
  });

  it('should initialize with empty retired cats', () => {
    const { result } = renderHook(() => useLegacy());
    expect(result.current.retiredCats).toEqual([]);
  });

  it('should calculate total legacy bonus', () => {
    const { result } = renderHook(() => useLegacy());
    expect(result.current.totalLegacyBonus).toBe(0);
  });

  it('should expose retireCat and canRetire', () => {
    const { result } = renderHook(() => useLegacy('u1'));
    expect(typeof result.current.retireCat).toBe('function');
    expect(typeof result.current.canRetire).toBe('function');
  });

  it('should return kitten bonuses', () => {
    const { result } = renderHook(() => useLegacy());
    const bonuses = result.current.getKittenBonuses();
    expect(bonuses).toHaveProperty('gradeBonus');
    expect(bonuses).toHaveProperty('healthBonus');
    expect(bonuses).toHaveProperty('trainingBonus');
    expect(bonuses).toHaveProperty('relationshipBonus');
  });
});
