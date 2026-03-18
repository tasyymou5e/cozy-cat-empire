import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useDailyObjectives } from '../useDailyObjectives';

describe('useDailyObjectives', () => {
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

  it('should initialize with empty objectives', () => {
    const { result } = renderHook(() => useDailyObjectives(undefined));
    expect(result.current.objectives).toEqual([]);
  });

  it('should expose trackProgress function', () => {
    const { result } = renderHook(() => useDailyObjectives('u1'));
    expect(typeof result.current.trackProgress).toBe('function');
  });
});
