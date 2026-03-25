import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }), or: () => ({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), unsubscribe: vi.fn() }),
  },
}));

describe('useCoopChallenges', () => {
  it('should initialize with empty challenges', async () => {
    const { useCoopChallenges } = await import('../useCoopChallenges');
    const { result } = renderHook(() => useCoopChallenges('user-1', []));
    expect(result.current.activeChallenges).toEqual([]);
    expect(result.current.loading).toBe(true);
  });
});
