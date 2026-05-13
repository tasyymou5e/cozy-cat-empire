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
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
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

  it('swallows cloud sync rejections without producing unhandled errors', async () => {
    const upsert = vi.fn().mockRejectedValue(new Error('network down'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert,
    });
    const { result } = renderHook(() => useBattlePass('u1'));
    // Flush the fire-and-forget effect.
    await new Promise((r) => setTimeout(r, 0));
    expect(upsert).toHaveBeenCalled();
    expect(result.current).toBeDefined();
  });
});
