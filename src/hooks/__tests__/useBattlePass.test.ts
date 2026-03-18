import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useBattlePass } from '../useBattlePass';

describe('useBattlePass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBattlePass(undefined));
    expect(result.current.loading).toBeDefined();
  });

  it('should expose claimReward function', () => {
    const { result } = renderHook(() => useBattlePass('u1'));
    expect(typeof result.current.claimReward).toBe('function');
  });
});
