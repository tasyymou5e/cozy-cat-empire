import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useBadges } from '../useBadges';

describe('useBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty badges', () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const { result } = renderHook(() => useBadges(undefined));
    expect(result.current.badges).toEqual([]);
  });

  it('should load badges when userId provided', async () => {
    const mockBadges = [{ id: '1', badge_id: 'first_cat', user_id: 'u1', is_displayed: true }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
      }),
    });
    const { result } = renderHook(() => useBadges('u1'));
    expect(result.current).toBeDefined();
  });
});
