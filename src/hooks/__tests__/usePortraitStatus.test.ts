import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ list: () => Promise.resolve({ data: [], error: null }) }) },
  },
}));

describe('usePortraitStatus', () => {
  it('should initialize with empty statuses', async () => {
    const { usePortraitStatus } = await import('../usePortraitStatus');
    const { result } = renderHook(() => usePortraitStatus([]));
    expect(result.current.statuses.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });
});
