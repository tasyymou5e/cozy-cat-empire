import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ list: () => Promise.resolve({ data: [], error: null }) }) },
  },
}));

describe('usePortraitStatus', () => {
  it('should return portrait categorization', async () => {
    const { usePortraitStatus } = await import('../usePortraitStatus');
    const { result } = renderHook(() => usePortraitStatus([]));
    expect(result.current.outdatedCats).toEqual([]);
    expect(result.current.outdatedCount).toBe(0);
  });
});
