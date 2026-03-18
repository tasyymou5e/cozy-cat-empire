import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { usePlayerStats } from '../usePlayerStats';

describe('usePlayerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('should initialize with null stats', () => {
    const { result } = renderHook(() => usePlayerStats(undefined));
    expect(result.current.stats).toBeNull();
  });

  it('should expose syncStats function', () => {
    const { result } = renderHook(() => usePlayerStats('u1'));
    expect(typeof result.current.syncStats).toBe('function');
  });
});
