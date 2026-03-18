import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useEventSnapshots } from '../useEventSnapshots';

describe('useEventSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
  });

  it('should expose createEventSnapshot', () => {
    const mockState = { cats: [], money: 100, day: 1 } as any;
    const { result } = renderHook(() => useEventSnapshots('u1', mockState));
    expect(typeof result.current.createEventSnapshot).toBe('function');
  });

  it('should not create snapshot without userId', async () => {
    const mockState = { cats: [], money: 100, day: 1 } as any;
    const { result } = renderHook(() => useEventSnapshots(undefined, mockState));
    await act(async () => {
      await result.current.createEventSnapshot('breeding');
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
