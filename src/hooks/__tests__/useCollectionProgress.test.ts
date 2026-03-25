import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/types/collections', () => ({
  BREED_COLLECTION: [],
  PERSONALITY_COLLECTION: [],
  TRICK_COLLECTION: [],
}));

vi.mock('@/types/costumes', () => ({
  COSTUMES: [],
}));

describe('useCollectionProgress', () => {
  it('should initialize with zero progress', async () => {
    const { default: useCollectionProgress } = await import('../useCollectionProgress');
    const { result } = renderHook(() => useCollectionProgress([], []));
    expect(result.current.breedProgress.collected).toBe(0);
  });
});
