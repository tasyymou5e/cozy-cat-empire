import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useLeaderboardRewards } from '../useLeaderboardRewards';

describe('useLeaderboardRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  it('should initialize with empty rewards', () => {
    const { result } = renderHook(() => useLeaderboardRewards(undefined));
    expect(result.current.rewards).toEqual([]);
  });

  it('should expose claimReward function', () => {
    const { result } = renderHook(() => useLeaderboardRewards('u1'));
    expect(typeof result.current.claimReward).toBe('function');
  });
});
