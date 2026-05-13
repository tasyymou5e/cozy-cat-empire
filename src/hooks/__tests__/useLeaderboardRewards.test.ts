import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { useLeaderboardRewards } from '../useLeaderboardRewards';

describe('useLeaderboardRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with empty rewards', () => {
    const { result } = renderHook(() => useLeaderboardRewards(undefined));
    expect(Array.isArray(result.current.rewards)).toBe(true);
  });

  it('should expose claimReward function', () => {
    const { result } = renderHook(() => useLeaderboardRewards('u1'));
    expect(typeof result.current.claimReward).toBe('function');
  });
});
