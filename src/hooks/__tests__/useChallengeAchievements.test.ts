import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useChallengeAchievements } from '../useChallengeAchievements';

describe('useChallengeAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  });

  it('should initialize with default stats', () => {
    const { result } = renderHook(() => useChallengeAchievements(undefined));
    expect(result.current.stats).toBeDefined();
  });

  it('should expose checkAndUpdateStreak', () => {
    const { result } = renderHook(() => useChallengeAchievements('u1'));
    expect(typeof result.current.checkAndUpdateStreak).toBe('function');
  });
});
