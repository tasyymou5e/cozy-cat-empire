import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useGlobalLeaderboard } from '../useGlobalLeaderboard';

describe('useGlobalLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it('should initialize with empty leaderboard', () => {
    const { result } = renderHook(() => useGlobalLeaderboard());
    expect(result.current.leaderboard).toEqual([]);
    expect(result.current.loading).toBeDefined();
  });

  it('should expose syncPlayerStats', () => {
    const { result } = renderHook(() => useGlobalLeaderboard());
    expect(typeof result.current.syncPlayerStats).toBe('function');
  });
});
