import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), data: [], error: null }), data: [], error: null }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), unsubscribe: vi.fn() }),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/types/clubs', () => ({
  getClubLevel: () => ({ level: 1, name: 'Bronze' }),
}));

describe('useClub', () => {
  it('should initialize with null club and loading state', async () => {
    const { useClub } = await import('../useClub');
    const { result } = renderHook(() => useClub('user-1'));
    expect(result.current.myClub).toBeNull();
    expect(result.current.members).toEqual([]);
  });
});
