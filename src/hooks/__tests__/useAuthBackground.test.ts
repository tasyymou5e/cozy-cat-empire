import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ list: () => Promise.resolve({ data: [], error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
  },
}));

vi.mock('@/lib/seasonUtils', () => ({
  getCurrentRealSeason: () => 'spring',
}));

describe('useAuthBackground', () => {
  it('should start in loading state', async () => {
    const { useAuthBackground } = await import('../useAuthBackground');
    const { result } = renderHook(() => useAuthBackground());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentSeason).toBe('spring');
  });
});
