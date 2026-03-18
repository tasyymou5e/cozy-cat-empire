import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useWeeklyChallenges } from '../useWeeklyChallenges';

describe('useWeeklyChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it('should initialize with empty challenges', () => {
    const { result } = renderHook(() => useWeeklyChallenges(undefined));
    expect(result.current.challenges).toEqual([]);
  });

  it('should expose updateProgress function', () => {
    const { result } = renderHook(() => useWeeklyChallenges('u1'));
    expect(typeof result.current.updateProgress).toBe('function');
  });
});
