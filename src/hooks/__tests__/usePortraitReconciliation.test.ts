import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ list: () => Promise.resolve({ data: [], error: null }) }) },
  },
}));

describe('usePortraitReconciliation', () => {
  it('should start with no missing portraits', async () => {
    const { usePortraitReconciliation } = await import('../usePortraitReconciliation');
    const { result } = renderHook(() => usePortraitReconciliation('user-1', [], vi.fn()));
    expect(result.current.missingPortraits).toEqual([]);
    expect(result.current.isReconciling).toBe(false);
  });
});
